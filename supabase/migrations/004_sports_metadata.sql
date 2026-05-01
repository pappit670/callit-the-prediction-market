-- ═══════════════════════════════════════════════════════════════
-- CALLIT v4 — Sports Market Metadata
-- File: 004_sports_metadata.sql
-- ═══════════════════════════════════════════════════════════════

-- Add sports-specific metadata columns to opinions table
alter table public.opinions add column if not exists is_sports_match boolean default false;
alter table public.opinions add column if not exists home_team_name text;
alter table public.opinions add column if not exists away_team_name text;
alter table public.opinions add column if not exists home_team_logo text;
alter table public.opinions add column if not exists away_team_logo text;
alter table public.opinions add column if not exists league_name text;
alter table public.opinions add column if not exists sport_type text; -- soccer | basketball | etc

-- Add index for sports queries
create index if not exists idx_opinions_sports on public.opinions(is_sports_match) where is_sports_match = true;

-- Update existing sports-like opinions if any (best effort)
update public.opinions
set is_sports_match = true
where statement ilike '% vs %' 
   or statement ilike '% win %' 
   or statement ilike '% score %';
