-- ═══════════════════════════════════════════════════════════════
-- CALLIT v1 — Supabase Schema Migration
-- File: 001_callit_markets.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── A) market_proposals — pre-publish review stage ─────────────
create table if not exists public.market_proposals (
  id                   uuid        primary key default gen_random_uuid(),
  question             text        not null,
  category             text        not null,
  outcome_type         text        not null,   -- binary | multiple_choice | numeric_bucketed
  proposed_close_time  timestamptz null,
  proposed_resolve_by  timestamptz null,
  resolution_source    text        null,
  resolution_rule      text        null,
  proposed_outcomes    jsonb       null,
  confidence           numeric     not null default 0.5,
  source_event_id      text        null,
  status               text        not null default 'new',
    -- new | review | approved | rejected | published
  notion_page_id       text        unique null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_market_proposals_status
  on public.market_proposals (status);

create index if not exists idx_market_proposals_updated_at
  on public.market_proposals (updated_at desc);

comment on table public.market_proposals is
  'Pre-publish review stage. Proposals flow: new → review → approved → published (or rejected).';

-- ── B) markets — published/live stage ─────────────────────────
create table if not exists public.markets (
  id                 uuid        primary key default gen_random_uuid(),
  question           text        not null,
  category           text        not null,
  status             text        not null default 'draft',
    -- draft | live | resolving | disputed | closed | resolved
  close_time         timestamptz null,
  resolve_by         timestamptz null,
  resolution_source  text        null,
  resolution_rule    text        null,
  image_url          text        null,
  risk_level         text        null,       -- low | medium | high
  source_event_id    text        null,
  featured           boolean     not null default false,
  rising             boolean     not null default false,
  total_staked       numeric     not null default 0,
  participant_count  int         not null default 0,
  notion_page_id     text        unique null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_markets_status
  on public.markets (status);

create index if not exists idx_markets_updated_at
  on public.markets (updated_at desc);

create index if not exists idx_markets_featured
  on public.markets (featured) where featured = true;

comment on table public.markets is
  'Published prediction markets. Source of truth for the Callit platform.';

-- ── C) market_outcomes ────────────────────────────────────────
create table if not exists public.market_outcomes (
  id              uuid        primary key default gen_random_uuid(),
  market_id       uuid        not null references public.markets(id) on delete cascade,
  label           text        not null,
  kind            text        not null,      -- binary | choice | numeric_bucket
  key             text        null,          -- machine-readable key e.g. "yes" "no"
  sort            int         not null default 0,
  min             numeric     null,          -- for numeric_bucket lower bound
  max             numeric     null,          -- for numeric_bucket upper bound
  is_overflow     boolean     not null default false,
  notion_page_id  text        unique null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_market_outcomes_market_id
  on public.market_outcomes (market_id);

comment on table public.market_outcomes is
  'Outcomes for each market. Linked to markets via market_id.';

-- ── updated_at trigger (shared function) ──────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_market_proposals_updated_at
  before update on public.market_proposals
  for each row execute function public.set_updated_at();

create or replace trigger trg_markets_updated_at
  before update on public.markets
  for each row execute function public.set_updated_at();

-- ── RLS: enable but allow service role full access ─────────────
alter table public.market_proposals enable row level security;
alter table public.markets          enable row level security;
alter table public.market_outcomes  enable row level security;

-- Service role bypasses RLS by default.
-- Allow authenticated users to read published markets.
create policy "anon_read_live_markets"
  on public.markets for select
  using (status = 'live');

create policy "anon_read_market_outcomes"
  on public.market_outcomes for select
  using (
    exists (
      select 1 from public.markets m
      where m.id = market_id and m.status = 'live'
    )
  );
