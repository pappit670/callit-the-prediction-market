-- ═══════════════════════════════════════════════════════════════
-- CALLIT v3 — Schema Alignment & Missing Tables
-- File: 003_schema_alignment.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Create profiles table (if not exists)
create table if not exists public.profiles (
    id                uuid primary key references auth.users(id) on delete cascade,
    username          text unique not null,
    email             text unique,
    avatar_url        text,
    bio               text,
    balance           numeric not null default 1000,
    reputation_score  numeric not null default 0,
    wins              int not null default 0,
    losses            int not null default 0,
    total_calls       int not null default 0,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. Create topics table
create table if not exists public.topics (
    id             uuid primary key default gen_random_uuid(),
    name           text not null,
    slug           text unique not null,
    icon           text,
    color          text,
    type           text default 'category', -- category | subtopic
    parent_id      uuid references public.topics(id),
    subtopic_of    text,
    active         boolean default true,
    auto_update    boolean default false,
    auto_created   boolean default false,
    source_event   text,
    created_at     timestamptz not null default now()
);

alter table public.topics enable row level security;
create policy "Topics are viewable by everyone" on public.topics for select using (true);

-- 3. Fix opinions table (rename from markets if needed, or create)
do $$
begin
    if exists (select from pg_tables where schemaname = 'public' and tablename = 'markets') then
        alter table public.markets rename to opinions;
    end if;
end $$;

create table if not exists public.opinions (
    id                  uuid primary key default gen_random_uuid(),
    statement           text not null,
    description         text,
    topic_id            uuid references public.topics(id),
    creator_id          uuid references public.profiles(id),
    status              text not null default 'open', -- open | closed | resolving | resolved
    options             jsonb not null default '["YES", "NO"]'::jsonb,
    end_time            timestamptz,
    resolve_by          timestamptz,
    resolution_source   text,
    resolution_rule     text,
    resolution_result   text,
    icon_url            text,
    image_url           text,
    call_count          int not null default 0,
    follower_count      int not null default 0,
    rising_score        numeric not null default 0,
    total_staked        numeric not null default 0,
    ai_generated        boolean default false,
    auto_generated      boolean default false,
    event_cluster       text,
    variation_index     int default 0,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- Ensure correct columns exist in opinions
alter table public.opinions add column if not exists statement text;
alter table public.opinions add column if not exists description text;
alter table public.opinions add column if not exists topic_id uuid references public.topics(id);
alter table public.opinions add column if not exists creator_id uuid references public.profiles(id);
alter table public.opinions add column if not exists options jsonb;
alter table public.opinions add column if not exists icon_url text;
alter table public.opinions add column if not exists follower_count int default 0;
alter table public.opinions add column if not exists call_count int default 0;
alter table public.opinions add column if not exists rising_score numeric default 0;

alter table public.opinions enable row level security;
create policy "Opinions are viewable by everyone" on public.opinions for select using (true);

-- 4. Create calls table
create table if not exists public.calls (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null references public.profiles(id) on delete cascade,
    opinion_id       uuid not null references public.opinions(id) on delete cascade,
    chosen_option    text not null,
    stake_amount     numeric not null,
    potential_payout numeric,
    status           text not null default 'active', -- active | won | lost | cancelled
    created_at       timestamptz not null default now()
);

alter table public.calls enable row level security;
create policy "Calls are viewable by everyone" on public.calls for select using (true);
create policy "Users can insert their own calls" on public.calls for insert with check (auth.uid() = user_id);

-- 5. Create positions table
create table if not exists public.positions (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid references public.profiles(id) on delete cascade,
    opinion_id       uuid not null references public.opinions(id) on delete cascade,
    stance           text not null check (stance in ('agree', 'disagree')),
    anonymous_alias  text,
    created_at       timestamptz not null default now()
);

alter table public.positions enable row level security;
create policy "Positions are viewable by everyone" on public.positions for select using (true);
create policy "Users can insert their own positions" on public.positions for insert with check (auth.uid() = user_id or auth.uid() is null);

-- 6. Create debates table
create table if not exists public.debates (
    id                  uuid primary key default gen_random_uuid(),
    opinion_id          uuid not null references public.opinions(id) on delete cascade,
    challenger_id       uuid references public.profiles(id),
    challenger_alias    text not null,
    challenger_stance   text not null,
    challenger_argument text,
    defender_id         uuid references public.profiles(id),
    defender_alias      text not null,
    defender_stance     text not null,
    defender_argument   text,
    challenger_votes    int not null default 0,
    defender_votes      int not null default 0,
    status              text not null default 'active',
    created_at          timestamptz not null default now()
);

alter table public.debates enable row level security;
create policy "Debates are viewable by everyone" on public.debates for select using (true);

-- 7. Add foreign key for topics in opinions if not already there
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'opinions_topic_id_fkey') then
        alter table public.opinions add constraint opinions_topic_id_fkey foreign key (topic_id) references public.topics(id);
    end if;
end $$;
