// supabase/functions/sync-notion/index.ts
// ═══════════════════════════════════════════════════════════════
// Callit v1 — Supabase ↔ Notion sync bridge
//
// CORRECTIONS vs previous draft:
//   • Targets Notion DATA SOURCE IDs (collection://...), not database IDs
//   • No keys are printed in logs or responses (ever)
//   • Three modes: enrich | qa_only | full
//   • Idempotent: notion_page_id tracked in Supabase for all rows
//   • dsToDbId() strips collection:// prefix correctly for API calls
//   • SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by runtime
//
// Secrets required (set via Supabase Dashboard → Edge Functions → Secrets):
//   NOTION_TOKEN
//   NOTION_DS_INGESTION   = collection://025f5d47-316a-4d95-92fb-c72d3a2cc712
//   NOTION_DS_MARKETS     = collection://2b78724c-b8bd-4778-8232-c76027bced4b
//   NOTION_DS_OUTCOMES    = collection://c15fa4b0-9534-4897-aef7-2ffc1cf2cab8
//
// Deploy:  supabase functions deploy sync-notion
// Invoke:  POST /functions/v1/sync-notion?mode=full&dryRun=1
// Modes:
//   enrich  — fill missing image/description on existing markets (no approval needed)
//   qa_only — write proposals from market_proposals → Notion Ingestion Queue only
//   full    — qa_only + read approvals back + auto-publish approved proposals
// ═══════════════════════════════════════════════════════════════

import { serve }        from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────
// ENV — all from Supabase secrets, never hardcoded
// ─────────────────────────────────────────────────────────────
const NOTION_TOKEN   = Deno.env.get("NOTION_TOKEN")   ?? "";
const DS_INGESTION   = Deno.env.get("NOTION_DS_INGESTION") ?? "";
const DS_MARKETS     = Deno.env.get("NOTION_DS_MARKETS")   ?? "";
const DS_OUTCOMES    = Deno.env.get("NOTION_DS_OUTCOMES")  ?? "";

// Auto-injected by Supabase Edge Function runtime
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")               ?? "";
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")   ?? "";

const NOTION_VERSION = "2025-09-03";
const NOTION_BASE    = "https://api.notion.com/v1";

// Config
const MIN_DAYS_AFTER_CLOSE = 1;
const MAX_DAYS_AFTER_CLOSE = 30;

// Supabase client
const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────────────────────────────────────────────────────
// LOGGING — structured JSON, keys never appear in output
// ─────────────────────────────────────────────────────────────
interface MappingLog {
  type: string;
  entity_id?: string;
  original_value: string;
  mapped_value: string;
  ts: string;
}
const mappingLogs: MappingLog[] = [];

function logMapping(entry: Omit<MappingLog, "ts">) {
  const log = { ...entry, ts: new Date().toISOString() };
  mappingLogs.push(log);
  // Only log type + entity, never values that could contain secrets
  console.warn(`[mapping] type=${log.type} entity=${log.entity_id ?? "-"}`);
}

// ─────────────────────────────────────────────────────────────
// DATA SOURCE ID HELPER
// "collection://025f5d47-316a-4d95-92fb-c72d3a2cc712"
// → "025f5d47316a4d9592fbc72d3a2cc712"
// ─────────────────────────────────────────────────────────────
function dsToId(ds: string): string {
  return ds.replace("collection://", "").replace(/-/g, "");
}

// ─────────────────────────────────────────────────────────────
// OPTION MAPPERS — strict Notion canonical names
// ─────────────────────────────────────────────────────────────
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[_\-]/g, " ");
}

function mapStatus(raw: string, id?: string): string {
  const n = norm(raw);
  if (n === "draft")     return "Draft";
  if (n === "live")      return "Live";
  if (n === "resolving") return "Resolving";
  if (n === "disputed")  return "Disputed";
  if (n === "closed")    return "Closed";
  if (n === "resolved")  return "Resolved";
  logMapping({ type: "unknown_status", entity_id: id, original_value: raw, mapped_value: "Draft" });
  return "Draft";
}

function mapCategory(raw: string, id?: string): string {
  const n = norm(raw);
  if (n === "sports") return "Sports";
  if (n === "crypto") return "Crypto";
  if (n === "live")   return "Live";
  logMapping({ type: "unknown_category", entity_id: id, original_value: raw, mapped_value: "Live" });
  return "Live";
}

function mapRiskLevel(raw: string | null | undefined, id?: string): string | null {
  if (!raw?.trim()) return null;
  const n = norm(raw);
  if (n === "low")    return "Low";
  if (n === "medium") return "Medium";
  if (n === "high")   return "High";
  logMapping({ type: "unknown_risk_level", entity_id: id, original_value: raw, mapped_value: "" });
  return null;
}

function mapOutcomeType(raw: string, id?: string): string {
  const n = norm(raw);
  if (n === "binary")                                           return "Binary";
  if (n === "multiple choice" || n === "multiple_choice")      return "Multiple choice";
  if (n === "numeric (bucketed)" || n === "numeric_bucketed" ||
      n === "numeric bucketed")                                 return "Numeric (bucketed)";
  logMapping({ type: "unknown_outcome_type", entity_id: id, original_value: raw, mapped_value: "Binary" });
  return "Binary";
}

function mapOutcomeKind(raw: string, id?: string): string {
  const n = norm(raw);
  if (n === "binary")                                                   return "Binary";
  if (n === "choice" || n === "multiple choice" || n === "multiple_choice") return "Choice";
  if (n === "numeric bucket" || n === "numeric_bucket")                 return "Numeric bucket";
  logMapping({ type: "unknown_outcome_kind", entity_id: id, original_value: raw, mapped_value: "Choice" });
  return "Choice";
}

// Ingestion queue uses its own status vocabulary
function mapIngestionStatus(raw: string): string {
  const n = norm(raw);
  if (n === "new")       return "New";
  if (n === "review")    return "Review";
  if (n === "approved")  return "Approved";
  if (n === "rejected")  return "Rejected";
  if (n === "published") return "Published";
  return "New";
}

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────
interface ValidationResult {
  blockingIssues: string[];
  warnings: string[];
}

function validateProposal(p: Record<string, unknown>): ValidationResult {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const now = Date.now();

  // 1) Non-empty question
  if (!String(p.question ?? "").trim()) {
    blocking.push("Question is empty");
  }

  // 2) Category
  const cat = mapCategory(String(p.category ?? ""), String(p.id ?? ""));
  if (!cat) blocking.push("Category blank after mapping");

  // 3) Timeline
  const closeMs   = p.proposed_close_time
    ? new Date(String(p.proposed_close_time)).getTime() : null;
  const resolveMs = p.proposed_resolve_by
    ? new Date(String(p.proposed_resolve_by)).getTime() : null;

  if (!closeMs)              blocking.push("proposed_close_time missing");
  else if (closeMs <= now)   blocking.push("proposed_close_time must be in the future");

  if (!resolveMs)            blocking.push("proposed_resolve_by missing");
  else if (closeMs && resolveMs < closeMs)
    blocking.push("proposed_resolve_by must be >= proposed_close_time");
  else if (closeMs && resolveMs) {
    const daysAfter = (resolveMs - closeMs) / 86_400_000;
    if (daysAfter < MIN_DAYS_AFTER_CLOSE)
      blocking.push(`resolve_by must be >= ${MIN_DAYS_AFTER_CLOSE}d after close`);
    if (daysAfter > MAX_DAYS_AFTER_CLOSE)
      warnings.push(`resolve_by is ${Math.round(daysAfter)}d after close (max recommended ${MAX_DAYS_AFTER_CLOSE})`);
  }

  // 4) Resolution source or rule
  const hasSource = !!String(p.resolution_source ?? "").trim();
  const hasRule   = !!String(p.resolution_rule   ?? "").trim();
  if (!hasSource && !hasRule)
    blocking.push("Needs resolution_source URL or resolution_rule text");

  // 5) Outcomes
  const rawOuts: unknown[] = Array.isArray(p.proposed_outcomes)
    ? p.proposed_outcomes
    : (typeof p.proposed_outcomes === "string"
        ? (() => { try { return JSON.parse(p.proposed_outcomes as string); } catch { return []; } })()
        : []);

  const ot = norm(String(p.outcome_type ?? "binary"));

  if (ot === "binary") {
    if (rawOuts.length !== 2) blocking.push(`Binary needs exactly 2 outcomes (got ${rawOuts.length})`);
    else {
      const labels = rawOuts.map((o) => norm(String(o)));
      if (!labels.includes("yes") || !labels.includes("no"))
        warnings.push(`Binary outcomes should be Yes/No; found: ${labels.join(", ")}`);
    }
  } else if (ot === "multiple choice" || ot === "multiple_choice") {
    if (rawOuts.length < 3 || rawOuts.length > 6)
      blocking.push(`Multiple choice needs 3–6 options (got ${rawOuts.length})`);
    const strs  = rawOuts.map((o) => String(o).trim());
    const uniq  = new Set(strs.map((s) => s.toLowerCase()));
    if (uniq.size < strs.length) blocking.push("Multiple choice options must be unique");
    if (strs.some((s) => !s))   blocking.push("Multiple choice options must not be empty");
  } else if (ot === "numeric bucketed" || ot === "numeric_bucketed") {
    for (const o of rawOuts as Record<string, unknown>[]) {
      if (o.min != null && o.max != null && !o.is_overflow) {
        if (Number(o.min) >= Number(o.max))
          blocking.push(`Bucket min(${o.min}) must be < max(${o.max})`);
      }
    }
  }

  return { blockingIssues: blocking, warnings };
}

// ─────────────────────────────────────────────────────────────
// QUESTION REWRITER
// ─────────────────────────────────────────────────────────────
function rewriteQuestion(question: string, outcomeType: string, closeTime: string | null): string {
  const ot      = norm(outcomeType);
  const dateStr = closeTime
    ? new Date(closeTime).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "<DATE>";
  const q = question.trim();

  if (ot === "binary") {
    if (/^will\s/i.test(q)) return q;
    return `Will ${q.replace(/\?$/, "")} by ${dateStr}?`;
  }
  if (ot === "multiple choice" || ot === "multiple_choice") {
    if (/^(which|who|what)\s/i.test(q)) return q;
    return `Which of the following will be true by ${dateStr}? (${q.replace(/\?$/, "")})`;
  }
  if (ot === "numeric bucketed" || ot === "numeric_bucketed") {
    if (/^what will\s/i.test(q)) return q;
    return `What will ${q.replace(/\?$/, "")} be on ${dateStr}?`;
  }
  return q;
}

// ─────────────────────────────────────────────────────────────
// NOTION API — thin wrapper
// ─────────────────────────────────────────────────────────────
async function notionReq(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${NOTION_BASE}/${endpoint}`, {
    method,
    headers: {
      Authorization:    `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type":   "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[notion] ${method} ${endpoint} → HTTP ${res.status}: ${errorText.slice(0, 500)}`);
    return { 
      error: true, 
      status: res.status, 
      statusText: res.statusText,
      body: errorText,
      method,
      endpoint
    };
  }
  return res.json() as Promise<Record<string, unknown>>;
}

// ── Notion property builders ───────────────────────────────────
const prop = {
  title:    (v: string) => ({ title:    [{ text: { content: v.slice(0, 2000) } }] }),
  text:     (v: string) => ({ rich_text: [{ text: { content: v.slice(0, 2000) } }] }),
  select:   (v: string) => ({ select:   { name: v } }),
  number:   (v: number) => ({ number:   v }),
  date:     (v: string) => ({ date:     { start: new Date(v).toISOString() } }),
  checkbox: (v: boolean) => ({ checkbox: v }),
  url:      (v: string | null) => ({ url: v || null }),
  relation: (id: string) => ({ relation: [{ id }] }),
};

// ─────────────────────────────────────────────────────────────
// MODE: enrich
// Fill missing image_url / description on existing markets.
// Calls your model API (GROQ_API_KEY) and/or Unsplash.
// Does NOT require approval — just enriches what's already Live.
// ─────────────────────────────────────────────────────────────
async function runEnrich(dryRun: boolean) {
  const counts = { enriched: 0, skipped: 0, errors: 0 };

  const { data: markets, error } = await supa
    .from("markets")
    .select("id, question, category, image_url, notion_page_id")
    .in("status", ["draft", "live"])
    .is("image_url", null)
    .not("notion_page_id", "is", null)
    .limit(20);

  if (error) { console.error("[enrich] supa fetch:", error.message); counts.errors++; return counts; }

  for (const market of markets ?? []) {
    try {
      if (dryRun) {
        console.log(`[dryRun/enrich] would enrich market ${market.id}`);
        counts.skipped++;
        continue;
      }

      // Example: resolve image via Unsplash (requires UNSPLASH_ACCESS_KEY secret)
      const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
      let imageUrl: string | null = null;

      if (unsplashKey) {
        const query    = encodeURIComponent(`${market.category} ${market.question.split(" ").slice(0, 4).join(" ")}`);
        const imgRes   = await fetch(
          `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } },
        );
        if (imgRes.ok) {
          const imgData = await imgRes.json() as Record<string, unknown>;
          const results = (imgData.results as Record<string, unknown>[]) ?? [];
          imageUrl = results[0]
            ? String((results[0].urls as Record<string,string>)?.small ?? "")
            : null;
        }
      }

      if (!imageUrl) { counts.skipped++; continue; }

      // Update Supabase
      await supa.from("markets").update({ image_url: imageUrl }).eq("id", market.id);

      // Update Notion
      if (market.notion_page_id) {
        await notionReq("PATCH", `pages/${market.notion_page_id}`, {
          properties: { "Image URL": prop.url(imageUrl) },
        });
      }

      counts.enriched++;
    } catch (e) {
      console.error(`[enrich] market ${market.id}:`, (e as Error).message);
      counts.errors++;
    }
  }

  return counts;
}

// ─────────────────────────────────────────────────────────────
// MODE: qa_only — Step A only
// Push proposals from Supabase → Notion Ingestion Queue.
// ─────────────────────────────────────────────────────────────
async function runQaOnly(dryRun: boolean) {
  const counts = { created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [] as any[] };
  const dbId   = dsToId(DS_INGESTION);

  const { data: proposals, error } = await supa
    .from("market_proposals")
    .select("*")
    .in("status", ["new", "review", "approved"])
    .order("updated_at", { ascending: true })
    .limit(50);

  if (error) { console.error("[qa_only] supa fetch:", error.message); counts.errors++; return counts; }

  for (const proposal of proposals ?? []) {
    try {
      const rewritten = rewriteQuestion(
        proposal.question,
        proposal.outcome_type,
        proposal.proposed_close_time,
      );

      const props: Record<string, unknown> = {
        "Proposed question": prop.title(rewritten),
        "Status":            prop.select(mapIngestionStatus(proposal.status)),
        "Category":          prop.select(mapCategory(proposal.category, proposal.id)),
        "Outcome type":      prop.select(mapOutcomeType(proposal.outcome_type, proposal.id)),
        "Confidence":        prop.number(Number(proposal.confidence ?? 0.5)),
      };

      if (proposal.proposed_close_time)
        props["Proposed close time"] = prop.date(proposal.proposed_close_time);
      if (proposal.proposed_resolve_by)
        props["Proposed resolve by"] = prop.date(proposal.proposed_resolve_by);
      if (proposal.resolution_source)
        props["Resolution source"] = prop.url(proposal.resolution_source);
      if (proposal.resolution_rule)
        props["Resolution rule"] = prop.text(proposal.resolution_rule);
      if (proposal.source_event_id)
        props["Source event id"] = prop.text(proposal.source_event_id);
      if (proposal.proposed_outcomes) {
        const outStr = typeof proposal.proposed_outcomes === "string"
          ? proposal.proposed_outcomes
          : JSON.stringify(proposal.proposed_outcomes);
        props["Proposed outcomes"] = prop.text(outStr);
      }

      if (dryRun) {
        console.log(`[dryRun/qa_only] would upsert proposal ${proposal.id} (notion_page_id=${proposal.notion_page_id ?? "new"})`);
        counts.skipped++;
        continue;
      }

      if (proposal.notion_page_id) {
        // Idempotent update
        const res = await notionReq("PATCH", `pages/${proposal.notion_page_id}`, { properties: props });
        if (res && !(res as any).error) counts.updated++;
        else { counts.errors++; counts.errorDetails.push(res); }
      } else {
        // Create new page + store notion_page_id back in Supabase
        const res = await notionReq("POST", "pages", {
          parent:     { data_source_id: dbId },
          properties: props,
        }) as Record<string, string> | null;

        if (res && res.id && !(res as any).error) {
          await supa
            .from("market_proposals")
            .update({ notion_page_id: res.id })
            .eq("id", proposal.id);
          counts.created++;
        } else {
          counts.errors++;
          counts.errorDetails.push(res);
        }
      }
    } catch (e) {
      console.error(`[qa_only] proposal ${proposal.id}:`, (e as Error).message);
      counts.errors++;
      counts.errorDetails.push({ error: (e as Error).message });
    }
  }

  return counts;
}

// ─────────────────────────────────────────────────────────────
// MODE: full — Steps A + B + C
// ─────────────────────────────────────────────────────────────

// Step B: read approvals/rejections from Notion → update Supabase
async function readApprovals(dryRun: boolean) {
  const counts = { approved: 0, rejected: 0, errors: 0, errorDetails: [] as any[] };
  const dbId   = dsToId(DS_INGESTION);

  const res = await notionReq("POST", `data_sources/${dbId}/query`, {
    filter: {
      or: [
        { property: "Status", select: { equals: "Approved" } },
        { property: "Status", select: { equals: "Rejected" } },
      ],
    },
    page_size: 100,
  });

  if (!res || (res as any).error) { 
    counts.errors++; 
    counts.errorDetails.push({
      step: "B_query",
      notionResponse: res,
      dbId
    });
    return counts; 
  }

  for (const page of (res.results as Record<string, unknown>[]) ?? []) {
    try {
      const pageId       = String(page.id);
      const props        = page.properties as Record<string, Record<string, unknown>>;
      const notionStatus = (props?.["Status"]?.select as Record<string, string>)?.name ?? "";
      const newStatus    = notionStatus === "Approved" ? "approved" : "rejected";

      const { data: rows } = await supa
        .from("market_proposals")
        .select("id, status")
        .eq("notion_page_id", pageId)
        .limit(1);

      if (!rows?.length || rows[0].status === newStatus) continue;

      if (dryRun) {
        console.log(`[dryRun/stepB] would set proposal ${rows[0].id} → ${newStatus}`);
        newStatus === "approved" ? counts.approved++ : counts.rejected++;
        continue;
      }

      await supa.from("market_proposals").update({ status: newStatus }).eq("id", rows[0].id);
      newStatus === "approved" ? counts.approved++ : counts.rejected++;
    } catch (e) {
      console.error("[stepB] page read error:", (e as Error).message);
      counts.errors++;
      counts.errorDetails.push({
        step: "B_process_page",
        pageId: page.id,
        error: (e as Error).message,
        stack: (e as Error).stack
      });
    }
  }

  return counts;
}

// Step C: auto-publish approved proposals → Notion Markets + Outcomes
async function publishApproved(dryRun: boolean) {
  const result = { published: 0, skipped: 0, blocked: [] as string[], errors: 0 };
  const mktsDbId     = dsToId(DS_MARKETS);
  const outcomesDbId = dsToId(DS_OUTCOMES);

  const { data: proposals, error } = await supa
    .from("market_proposals")
    .select("*")
    .eq("status", "approved")
    .order("updated_at", { ascending: true })
    .limit(20);

  if (error) { console.error("[stepC] supa fetch:", error.message); result.errors++; return result; }

  for (const proposal of proposals ?? []) {
    try {
      const { blockingIssues, warnings } = validateProposal(proposal);

      if (blockingIssues.length) {
        // Do NOT log the proposal content — only log the issue types
        console.warn(`[stepC] proposal ${proposal.id} blocked: ${blockingIssues.length} issue(s)`);
        result.blocked.push(`${proposal.id}: ${blockingIssues.join("; ")}`);
        result.skipped++;
        continue;
      }
      if (warnings.length) {
        console.warn(`[stepC] proposal ${proposal.id} warnings: ${warnings.length}`);
      }

      if (dryRun) {
        console.log(`[dryRun/stepC] would publish proposal ${proposal.id}`);
        result.published++;
        continue;
      }

      const rewritten = rewriteQuestion(
        proposal.question,
        proposal.outcome_type,
        proposal.proposed_close_time,
      );

      // ── 1. Upsert market page in Notion Markets ───────────────
      const marketProps: Record<string, unknown> = {
        "Question":     prop.title(rewritten),
        "Status":       prop.select("Live"),
        "Category":     prop.select(mapCategory(proposal.category, proposal.id)),
        "Outcome type": prop.select(mapOutcomeType(proposal.outcome_type, proposal.id)),
        "Goes live at": prop.date(new Date().toISOString()),
      };
      if (proposal.proposed_close_time)
        marketProps["Close time"] = prop.date(proposal.proposed_close_time);
      if (proposal.proposed_resolve_by)
        marketProps["Resolve by"] = prop.date(proposal.proposed_resolve_by);
      if (proposal.resolution_source)
        marketProps["Resolution source"] = prop.url(proposal.resolution_source);
      if (proposal.resolution_rule)
        marketProps["Resolution rule"] = prop.text(proposal.resolution_rule);
      if (proposal.source_event_id)
        marketProps["Source event id"] = prop.text(proposal.source_event_id);

      const riskLevel = mapRiskLevel(null, proposal.id); // extend later if confidence → risk
      if (riskLevel) marketProps["Risk level"] = prop.select(riskLevel);

      // Check if market already exists in Supabase (idempotency)
      const { data: existingMarkets } = await supa
        .from("markets")
        .select("id, notion_page_id")
        .eq("source_event_id", proposal.source_event_id ?? proposal.id)
        .limit(1);

      let marketId: string;
      let marketNotionId: string;

      if (existingMarkets?.length && existingMarkets[0].notion_page_id) {
        // Update existing — idempotent
        const res = await notionReq("PATCH",
          `pages/${existingMarkets[0].notion_page_id}`,
          { properties: marketProps },
        );
        if (!res) { result.errors++; continue; }
        marketId       = existingMarkets[0].id;
        marketNotionId = existingMarkets[0].notion_page_id;
      } else {
        // Create new market page in Notion
        const res = await notionReq("POST", "pages", {
          parent:     { data_source_id: mktsDbId },
          properties: marketProps,
        }) as Record<string, string> | null;

        if (!res?.id) { result.errors++; continue; }
        marketNotionId = res.id;

        // Upsert into Supabase markets
        const { data: newMarket } = await supa
          .from("markets")
          .upsert({
            question:          rewritten,
            category:          proposal.category,
            status:            "live",
            close_time:        proposal.proposed_close_time ?? null,
            resolve_by:        proposal.proposed_resolve_by ?? null,
            resolution_source: proposal.resolution_source ?? null,
            resolution_rule:   proposal.resolution_rule ?? null,
            source_event_id:   proposal.source_event_id ?? proposal.id,
            notion_page_id:    marketNotionId,
          }, { onConflict: "notion_page_id" })
          .select("id")
          .single();

        if (!newMarket?.id) { result.errors++; continue; }
        marketId = newMarket.id;
      }

      // ── 2. Upsert outcomes ────────────────────────────────────
      const rawOuts: unknown[] = Array.isArray(proposal.proposed_outcomes)
        ? proposal.proposed_outcomes
        : (typeof proposal.proposed_outcomes === "string"
            ? (() => { try { return JSON.parse(proposal.proposed_outcomes); } catch { return []; } })()
            : []);

      for (let sort = 0; sort < rawOuts.length; sort++) {
        const raw        = rawOuts[sort];
        const isObj      = typeof raw === "object" && raw !== null;
        const label      = isObj ? String((raw as Record<string, unknown>).label ?? raw) : String(raw);
        const rawKind    = isObj ? String((raw as Record<string, unknown>).kind ?? "choice") : "choice";
        const kind       = mapOutcomeKind(rawKind, `${proposal.id}:${sort}`);
        const key        = isObj ? String((raw as Record<string, unknown>).key ?? label.toLowerCase()) : label.toLowerCase();
        const min        = isObj ? ((raw as Record<string, unknown>).min as number | null) : null;
        const max        = isObj ? ((raw as Record<string, unknown>).max as number | null) : null;
        const isOverflow = isObj ? Boolean((raw as Record<string, unknown>).is_overflow) : false;

        const outcomeProps: Record<string, unknown> = {
          "Label":   prop.title(label),
          "Kind":    prop.select(kind),
          "Sort":    prop.number(sort),
          "Market":  prop.relation(marketNotionId),
        };
        if (key)         outcomeProps["Key"]         = prop.text(key);
        if (min != null) outcomeProps["Min"]         = prop.number(min);
        if (max != null) outcomeProps["Max"]         = prop.number(max);
        if (isOverflow)  outcomeProps["Is overflow"] = prop.checkbox(true);

        // Idempotency check
        const { data: existingOutcome } = await supa
          .from("market_outcomes")
          .select("id, notion_page_id")
          .eq("market_id", marketId)
          .eq("sort", sort)
          .limit(1);

        if (existingOutcome?.length && existingOutcome[0].notion_page_id) {
          await notionReq("PATCH", `pages/${existingOutcome[0].notion_page_id}`, { properties: outcomeProps });
        } else {
          const res = await notionReq("POST", "pages", {
            parent:     { data_source_id: outcomesDbId },
            properties: outcomeProps,
          }) as Record<string, string> | null;

          if (res?.id) {
            await supa.from("market_outcomes").upsert({
              market_id:     marketId,
              label, kind, key,
              sort,
              min:           min ?? null,
              max:           max ?? null,
              is_overflow:   isOverflow,
              notion_page_id: res.id,
            }, { onConflict: "notion_page_id" });
          }
        }
      }

      // ── 3. Mark proposal published in Supabase + Notion ──────
      await supa.from("market_proposals")
        .update({ status: "published" })
        .eq("id", proposal.id);

      if (proposal.notion_page_id) {
        await notionReq("PATCH", `pages/${proposal.notion_page_id}`, {
          properties: { "Status": prop.select("Published") },
        });
      }

      result.published++;
      console.log(`[stepC] published proposal=${proposal.id} market=${marketId}`);

    } catch (e) {
      console.error(`[stepC] proposal ${proposal.id}:`, (e as Error).message);
      result.errors++;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
serve(async (req) => {
  // Only POST allowed
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  // Guard: fail loudly if secrets are missing (never reveal values)
  const missing = [
    !NOTION_TOKEN    && "NOTION_TOKEN",
    !DS_INGESTION    && "NOTION_DS_INGESTION",
    !DS_MARKETS      && "NOTION_DS_MARKETS",
    !DS_OUTCOMES     && "NOTION_DS_OUTCOMES",
    !SUPABASE_URL    && "SUPABASE_URL",
    !SUPABASE_KEY    && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missing.length) {
    return new Response(
      JSON.stringify({ error: "Missing secrets", missing }),
      { status: 500 },
    );
  }

  const url    = new URL(req.url);
  const mode   = url.searchParams.get("mode") ?? "full";    // enrich | qa_only | full
  const dryRun = url.searchParams.get("dryRun") === "1";

  console.log(`[sync-notion] mode=${mode} dryRun=${dryRun}`);
  const t0 = Date.now();

  try {
    let body: Record<string, unknown> = {};

    if (mode === "enrich") {
      const enrich = await runEnrich(dryRun);
      body = { enrich };

    } else if (mode === "qa_only") {
      const stepA = await runQaOnly(dryRun);
      body = { stepA };

    } else {
      // full: A → B → C (sequential — B needs A's notion_page_ids, C needs B's statuses)
      const stepA = await runQaOnly(dryRun);
      const stepB = await readApprovals(dryRun);
      const stepC = await publishApproved(dryRun);
      body = { stepA, stepB, stepC };
    }

    const totalErrors = Object.values(body).reduce((acc, v) => {
      return acc + ((v as Record<string, number>)?.errors ?? 0);
    }, 0);

    return new Response(
      JSON.stringify({
        ok:             totalErrors === 0,
        mode,
        dryRun,
        durationMs:     Date.now() - t0,
        ...body,
        unknownMappings: mappingLogs,   // type + entity_id only, no raw values
        ts:             new Date().toISOString(),
      }, null, 2),
      {
        status:  totalErrors > 0 ? 207 : 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  } catch (e) {
    // Never include stack trace in response (may contain env paths)
    console.error("[sync-notion] fatal:", (e as Error).message);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal error — check function logs" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
