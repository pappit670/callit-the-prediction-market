-- ═══════════════════════════════════════════════════════════════
-- CALLIT v2 — Trading Engine Schema
-- File: 002_trading_engine.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── A) orders — limit order book ────────────────────────────────
create table if not exists public.orders (
  id          uuid        primary key default gen_random_uuid(),
  opinion_id  uuid        not null references public.opinions(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  side        text        not null check (side in ('YES','NO')),
  price       numeric     not null check (price >= 0 and price <= 1),
  amount      numeric     not null check (amount > 0),
  filled      numeric     not null default 0,
  status      text        not null default 'open'
                check (status in ('open','partial','filled','cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_orders_opinion_id on public.orders (opinion_id);
create index if not exists idx_orders_user_id    on public.orders (user_id);
create index if not exists idx_orders_status     on public.orders (status) where status = 'open';

create or replace trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ── B) trades — matched trade history ───────────────────────────
create table if not exists public.trades (
  id              uuid        primary key default gen_random_uuid(),
  opinion_id      uuid        not null references public.opinions(id) on delete cascade,
  buy_order_id    uuid        null references public.orders(id),
  sell_order_id   uuid        null references public.orders(id),
  price           numeric     not null,   -- 0–1 representing YES probability
  amount          numeric     not null,
  is_virtual      boolean     not null default false, -- system-generated virtual liquidity trade
  executed_at     timestamptz not null default now()
);

create index if not exists idx_trades_opinion_id   on public.trades (opinion_id);
create index if not exists idx_trades_executed_at  on public.trades (executed_at desc);

-- ── C) market_disputes — user flags ─────────────────────────────
create table if not exists public.market_disputes (
  id          uuid        primary key default gen_random_uuid(),
  opinion_id  uuid        not null references public.opinions(id) on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  reason      text        not null,
  status      text        not null default 'open'
                check (status in ('open','under_review','resolved','dismissed')),
  admin_note  text        null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_disputes_opinion_id on public.market_disputes (opinion_id);
create index if not exists idx_disputes_user_id    on public.market_disputes (user_id);
create index if not exists idx_disputes_status     on public.market_disputes (status);

create or replace trigger trg_disputes_updated_at
  before update on public.market_disputes
  for each row execute function public.set_updated_at();

-- ── D) notifications ─────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  type        text        not null,
    -- 'market_alert' | 'match_event' | 'personal' | 'resolution' | 'system'
  title       text        not null,
  body        text        not null,
  opinion_id  uuid        null references public.opinions(id) on delete set null,
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifs_user_id    on public.notifications (user_id);
create index if not exists idx_notifs_read       on public.notifications (user_id, read) where read = false;
create index if not exists idx_notifs_created_at on public.notifications (created_at desc);

-- ── E) market_lifecycle_log ──────────────────────────────────────
create table if not exists public.market_lifecycle_log (
  id          uuid        primary key default gen_random_uuid(),
  opinion_id  uuid        not null references public.opinions(id) on delete cascade,
  from_status text        not null,
  to_status   text        not null,
  reason      text        null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_lifecycle_opinion_id on public.market_lifecycle_log (opinion_id);
create index if not exists idx_lifecycle_created_at on public.market_lifecycle_log (created_at desc);

-- ── F) Add resolution_result column to opinions ──────────────────
alter table public.opinions
  add column if not exists resolution_result     text    null,
  add column if not exists resolution_source     text    null,
  add column if not exists resolution_condition  text    null,
  add column if not exists dispute_count         int     not null default 0,
  add column if not exists last_trade_price      numeric null,
  add column if not exists participant_count     int     not null default 0,
  add column if not exists archived_at           timestamptz null;

-- ── G) RLS ───────────────────────────────────────────────────────
alter table public.orders              enable row level security;
alter table public.trades              enable row level security;
alter table public.market_disputes     enable row level security;
alter table public.notifications       enable row level security;
alter table public.market_lifecycle_log enable row level security;

-- Orders: users can read all open orders, manage their own
create policy "read_open_orders"
  on public.orders for select using (status = 'open');

create policy "insert_own_orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "update_own_orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- Trades: public read
create policy "read_trades"
  on public.trades for select using (true);

-- Disputes: authenticated users can read/insert their own
create policy "read_disputes"
  on public.market_disputes for select using (true);

create policy "insert_dispute"
  on public.market_disputes for insert
  with check (auth.uid() = user_id);

-- Notifications: users see only their own
create policy "read_own_notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "update_own_notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Lifecycle log: public read
create policy "read_lifecycle_log"
  on public.market_lifecycle_log for select using (true);
