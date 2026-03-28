# Callit v1 — Supabase → Notion Sync Setup

## What this does

Every 1–5 minutes the Edge Function `sync_notion` runs and:

1. **Step A** — Pushes new/review/approved proposals from Supabase → Notion Ingestion Queue
2. **Step B** — Reads approvals/rejections back from Notion → updates Supabase `market_proposals.status`
3. **Step C** — Auto-publishes any approved+validated proposal to Notion Markets as **Live**, creates outcomes, marks proposal as published

---

## File structure

```
supabase/
├── migrations/
│   └── 001_callit_markets.sql        ← Run this first
└── functions/
    └── sync_notion/
        └── index.ts                  ← Edge Function
```

---

## Step 1 — Run the SQL migration

In Supabase Dashboard → SQL Editor, paste and run `001_callit_markets.sql`.

This creates:
- `market_proposals` — pre-publish review queue
- `markets` — live published markets
- `market_outcomes` — outcomes for each market
- `set_updated_at()` trigger function
- RLS policies (service role bypasses, public can read live markets)

Verify:
```sql
select table_name from information_schema.tables
where table_schema = 'public'
and table_name in ('market_proposals', 'markets', 'market_outcomes');
```

---

## Step 2 — Set Supabase secrets

In Supabase Dashboard → Project Settings → Edge Functions → Secrets,
OR via CLI:

```bash
supabase secrets set NOTION_TOKEN=ntn_YOUR_NOTION_TOKEN_HERE-

supabase secrets set NOTION_DS_INGESTION=collection://025f5d47-316a-4d95-92fb-c72d3a2cc712
supabase secrets set NOTION_DS_MARKETS=collection://2b78724c-b8bd-4778-8232-c76027bced4b
supabase secrets set NOTION_DS_OUTCOMES=collection://c15fa4b0-9534-4897-aef7-2ffc1cf2cab8
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected by Supabase into every Edge Function — you don't need to set them manually.

---

## Step 3 — Deploy the Edge Function

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref rzfyhkksaolyodlddrpo

# Deploy
supabase functions deploy sync_notion

# Confirm it deployed
supabase functions list
```

---

## Step 4 — Test it manually

### Test 1: Insert a proposal and check it appears in Notion

```sql
insert into public.market_proposals
  (question, category, outcome_type, proposed_close_time, proposed_resolve_by,
   resolution_source, proposed_outcomes, confidence)
values (
  'Will Bitcoin close above $100,000 before end of Q2 2025?',
  'crypto',
  'binary',
  now() + interval '30 days',
  now() + interval '32 days',
  'https://coinmarketcap.com/currencies/bitcoin/',
  '["Yes", "No"]'::jsonb,
  0.58
);
```

Then trigger the function:

```bash
# Using CLI
supabase functions invoke sync_notion --method POST

# Or with curl (get your project URL from Supabase dashboard)
curl -X POST https://rzfyhkksaolyodlddrpo.supabase.co/functions/v1/sync_notion \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Expected:** The proposal should appear in your Notion Ingestion Queue database with Status = "New".

### Test 2: Dry run (no changes made)

```bash
curl -X POST "https://rzfyhkksaolyodlddrpo.supabase.co/functions/v1/sync_notion?dryRun=1" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Response shows what WOULD happen without actually doing it.

### Test 3: Full approval flow

1. Find the proposal row in Notion Ingestion Queue
2. Change its Status to **Approved**
3. Run the function again:
   ```bash
   supabase functions invoke sync_notion --method POST
   ```
4. **Expected:**
   - Supabase `market_proposals.status` changes to `approved`
   - On the same or next run, a new page appears in Notion Markets with Status = **Live**
   - Outcomes appear in Notion Market Outcomes linked to the market
   - Supabase `market_proposals.status` changes to `published`
   - Supabase `markets` table has a new row with `status = 'live'`

### Test 4: Idempotency (no duplicates)

Run the function 3 times back-to-back:

```bash
for i in 1 2 3; do
  supabase functions invoke sync_notion --method POST
  sleep 2
done
```

**Expected:** Counts show `updated` (not `created`) on runs 2 and 3. No duplicate pages in Notion.

---

## Step 5 — Schedule the function

### Option A: Supabase pg_cron (recommended)

Enable pg_cron extension in Supabase Dashboard → Database → Extensions.

Then in SQL Editor:

```sql
-- Run every 2 minutes
select cron.schedule(
  'sync-notion-every-2min',
  '*/2 * * * *',
  $$
  select net.http_post(
    url    := 'https://rzfyhkksaolyodlddrpo.supabase.co/functions/v1/sync_notion',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body   := '{}'::jsonb
  ) as request_id;
  $$
);

-- Verify it's scheduled
select * from cron.job;

-- To pause it later
select cron.unschedule('sync-notion-every-2min');
```

### Option B: Supabase Dashboard cron (no pg_cron needed)

Supabase Dashboard → Edge Functions → `sync_notion` → Schedule → Every 2 minutes.

### Option C: External cron (Railway, GitHub Actions)

```bash
# .github/workflows/sync.yml
name: Sync Notion
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://rzfyhkksaolyodlddrpo.supabase.co/functions/v1/sync_notion \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}"
```

---

## How the approval flow works

```
Supabase market_proposals (status: 'new')
           │
           ▼  [Step A - every run]
Notion Ingestion Queue (Status: New)
           │
           │  [Manual: reviewer changes Status to Approved/Rejected in Notion]
           ▼
Notion Ingestion Queue (Status: Approved)
           │
           ▼  [Step B - next run]
Supabase market_proposals (status: 'approved')
           │
           ▼  [Step C - same run, after Step B]
Notion Markets (Status: Live) + Notion Market Outcomes
Supabase markets (status: 'live')
Supabase market_proposals (status: 'published')
```

---

## Validation rules (blocking — must pass to publish)

| Rule | Details |
|---|---|
| Non-empty question | |
| Valid category | Maps to Sports / Crypto / Live |
| Close time in future | |
| Resolve by ≥ close time | |
| Resolve by within 1–30 days of close | Configurable in index.ts |
| Has resolution source OR rule | URL or text |
| Binary: exactly 2 outcomes | Yes + No |
| Multiple choice: 3–6 unique non-empty options | |
| Numeric: valid min < max per bucket | |

---

## Question rewrite rules

| Type | Pattern applied |
|---|---|
| Binary | `Will <event> by <DATE>?` |
| Multiple choice | `Which of the following will be true by <DATE>? (...)` |
| Numeric | `What will <metric> be on <DATE>?` |

If question already matches the pattern → kept as-is.

---

## Notion option mappings (strict)

### Markets
| Supabase value | Notion value |
|---|---|
| draft | Draft |
| live | Live |
| resolving | Resolving |
| disputed | Disputed |
| closed | Closed |
| resolved | Resolved |
| sports | Sports |
| crypto | Crypto |
| live (category) | Live |
| binary | Binary |
| multiple_choice | Multiple choice |
| numeric_bucketed | Numeric (bucketed) |
| low / medium / high | Low / Medium / High |

### Market Outcomes
| Supabase value | Notion value |
|---|---|
| binary | Binary |
| choice | Choice |
| numeric_bucket | Numeric bucket |

All unknown values are logged and mapped to safe defaults.

---

## Monitoring

The function returns a JSON response on every run:

```json
{
  "ok": true,
  "dryRun": false,
  "durationMs": 342,
  "stepA_proposals": { "created": 2, "updated": 0, "skipped": 0, "errors": 0 },
  "stepB_approvals": { "approved": 1, "rejected": 0, "errors": 0 },
  "stepC_publish":   { "published": 1, "skipped": 0, "blocked": [], "errors": 0 },
  "unknownMappings": [],
  "timestamp": "2025-03-22T14:30:00.000Z"
}
```

View logs: Supabase Dashboard → Edge Functions → `sync_notion` → Logs.

`unknownMappings` shows any values that didn't match the strict Notion option names — review these and add mappings to `index.ts` if needed.

---

## Troubleshooting

**"Proposal appears in Notion but not publishing"**
→ Run with `?dryRun=1` and check `stepC_publish.blocked` in the response — it lists which validation rules failed.

**"Duplicate pages in Notion"**
→ Check that `notion_page_id` is populated in Supabase after the first create. If it's null, the upsert is using `onConflict: "notion_page_id"` which won't match nulls. Check for errors in Step A logs.

**"Function times out"**
→ Default timeout is 2s for free tier, 10s for Pro. Reduce the `.limit(50)` and `.limit(20)` in `index.ts` if needed, or upgrade to Supabase Pro.

**"Notion API 400 errors"**
→ Check `unknownMappings` in the response — an unrecognised option name causes Notion to reject the page. Add the mapping to the normaliser functions in `index.ts`.

**"Function not deploying"**
→ Check `supabase/config.toml` exists and has your project ref. Run `supabase status` to verify link.
