// src/lib/marketLifecycle.ts
// Market lifecycle state machine for Callit.
// States: ACTIVE → RESOLVING → RESOLVED → ARCHIVED

import { supabase } from "@/supabaseClient";

export type MarketState = "open" | "resolving" | "resolved" | "archived";

export interface MarketStateInfo {
  state: MarketState;
  label: string;
  color: string;
  description: string;
}

const STATE_META: Record<MarketState, Omit<MarketStateInfo, "state">> = {
  open:       { label: "Active",    color: "#22C55E", description: "Market is live and accepting calls" },
  resolving:  { label: "Resolving", color: "#F5C518", description: "Deadline passed — pending outcome verification" },
  resolved:   { label: "Resolved",  color: "#2563EB", description: "Outcome confirmed" },
  archived:   { label: "Archived",  color: "#6B7280", description: "Market archived" },
};

export function getStateInfo(state: MarketState): MarketStateInfo {
  return { state, ...(STATE_META[state] ?? STATE_META.open) };
}

// ── Determine what state a market SHOULD be in ─────────────────
export function computeTargetState(opinion: {
  status: string;
  end_time?: string | null;
  resolution_result?: string | null;
  archived_at?: string | null;
}): MarketState {
  const now = Date.now();

  if (opinion.archived_at) return "archived";
  if (opinion.resolution_result) return "resolved";
  if (opinion.end_time && new Date(opinion.end_time).getTime() <= now) return "resolving";
  return "open";
}

// ── Advance market state in Supabase ─────────────────────────
export async function advanceMarketState(
  opinionId: string,
  currentStatus: string,
  targetState: MarketState,
  reason?: string
): Promise<boolean> {
  if (currentStatus === targetState) return false;

  const { error } = await supabase
    .from("opinions")
    .update({ status: targetState })
    .eq("id", opinionId);

  if (error) {
    console.error("[lifecycle] Failed to advance state:", error);
    return false;
  }

  // Log the transition
  await supabase.from("market_lifecycle_log").insert({
    opinion_id: opinionId,
    from_status: currentStatus,
    to_status: targetState,
    reason: reason ?? "auto",
  });

  return true;
}

// ── Resolve a market with an outcome ──────────────────────────
export async function resolveMarket(
  opinionId: string,
  result: string, // "Yes" | "No" | option label
  sourceNote?: string
): Promise<boolean> {
  const { error } = await supabase
    .from("opinions")
    .update({
      status: "resolved",
      resolution_result: result,
      resolution_source: sourceNote ?? null,
    })
    .eq("id", opinionId);

  if (error) return false;

  await supabase.from("market_lifecycle_log").insert({
    opinion_id: opinionId,
    from_status: "resolving",
    to_status: "resolved",
    reason: `Resolved as: ${result}`,
  });

  return true;
}

// ── Archive a resolved market ─────────────────────────────────
export async function archiveMarket(opinionId: string): Promise<boolean> {
  const { error } = await supabase
    .from("opinions")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", opinionId);

  if (error) return false;

  await supabase.from("market_lifecycle_log").insert({
    opinion_id: opinionId,
    from_status: "resolved",
    to_status: "archived",
    reason: "Auto-archived after resolution",
  });

  return true;
}

// ── Validate a market before publishing ───────────────────────
export interface PublishValidation {
  canPublish: boolean;
  errors: string[];
}

export function validateBeforePublish(draft: {
  statement?: string;
  end_time?: string | null;
  resolution_condition?: string | null;
  resolution_source?: string | null;
  options?: string[];
}): PublishValidation {
  const errors: string[] = [];
  const now = Date.now();

  if (!draft.statement || draft.statement.trim().length < 10) {
    errors.push("Question is required (min 10 characters).");
  }

  if (!draft.end_time) {
    errors.push("An end date/deadline is required.");
  } else if (new Date(draft.end_time).getTime() <= now) {
    errors.push("Deadline must be in the future. The event may have already occurred.");
  }

  if (!draft.options || draft.options.length < 2) {
    errors.push("At least 2 outcome options are required.");
  }

  if (!draft.resolution_condition || draft.resolution_condition.trim().length < 5) {
    errors.push("A resolution condition is required (how will this be decided?).");
  }

  return { canPublish: errors.length === 0, errors };
}

// ── Check single market and auto-advance if needed ────────────
export async function checkAndAdvance(opinion: {
  id: string;
  status: string;
  end_time?: string | null;
  resolution_result?: string | null;
  archived_at?: string | null;
}): Promise<MarketState> {
  const target = computeTargetState(opinion);
  await advanceMarketState(opinion.id, opinion.status, target);
  return target;
}

// ── Fetch lifecycle log for a market ─────────────────────────
export async function fetchLifecycleLog(opinionId: string) {
  const { data } = await supabase
    .from("market_lifecycle_log")
    .select("*")
    .eq("opinion_id", opinionId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}
