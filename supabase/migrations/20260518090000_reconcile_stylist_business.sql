-- Kichana — reconciliation migration
-- Makes the Studio (stylist) and Business (vendor) features self-sufficient on
-- top of the v1 schema. Fully idempotent and safe to re-run.

create extension if not exists "pgcrypto";

-- shared updated_at trigger fn (v1 never defined it)
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- =========================================================
-- stylists — surface fields used by Studio + Business + map
-- =========================================================
alter table public.stylists
  add column if not exists user_id uuid,
  add column if not exists rating numeric(3,2) not null default 0,
  add column if not exists review_count integer not null default 0,
  add column if not exists completed_bookings_count integer not null default 0,
  add column if not exists home_service_enabled boolean not null default false,
  add column if not exists transport_fee integer not null default 0,
  add column if not exists deposit_percentage integer not null default 50,
  add column if not exists tiktok text,
  add column if not exists facebook text,
  add column if not exists lat numeric(9,6),
  add column if not exists lng numeric(9,6);

-- user_id mirrors profile_id (both equal auth.users.id in v1)
update public.stylists set user_id = profile_id where user_id is null;

-- =========================================================
-- services — Studio fields
-- =========================================================
alter table public.services
  add column if not exists subcategory text,
  add column if not exists deposit_override integer,
  add column if not exists hair_type_tags text[] not null default '{}',
  add column if not exists intro_offer_active boolean not null default false,
  add column if not exists intro_offer_percent integer,
  add column if not exists sort_order integer not null default 0;

-- =========================================================
-- portfolio_images — stylist gallery (cover, ordering, captions)
-- =========================================================
create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  image_url text not null,
  service_id uuid references public.services(id) on delete set null,
  caption text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_portfolio_images_stylist_sort
  on public.portfolio_images(stylist_id, sort_order);
alter table public.portfolio_images enable row level security;
drop policy if exists "portfolio_images public read" on public.portfolio_images;
create policy "portfolio_images public read" on public.portfolio_images
  for select using (true);
drop policy if exists "portfolio_images owner write" on public.portfolio_images;
create policy "portfolio_images owner write" on public.portfolio_images
  for all using (exists (select 1 from public.stylists s where s.id = portfolio_images.stylist_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from public.stylists s where s.id = portfolio_images.stylist_id and s.profile_id = auth.uid()));

-- =========================================================
-- weekly availability
-- =========================================================
create table if not exists public.stylist_availability (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists idx_avail_stylist on public.stylist_availability(stylist_id, weekday);
alter table public.stylist_availability enable row level security;
drop policy if exists "availability public read" on public.stylist_availability;
create policy "availability public read" on public.stylist_availability
  for select using (true);
drop policy if exists "availability owner write" on public.stylist_availability;
create policy "availability owner write" on public.stylist_availability
  for all using (exists (select 1 from public.stylists s where s.id = stylist_availability.stylist_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from public.stylists s where s.id = stylist_availability.stylist_id and s.profile_id = auth.uid()));

-- date-specific overrides
create table if not exists public.stylist_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  date date not null,
  is_closed boolean not null default false,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  unique (stylist_id, date)
);
alter table public.stylist_schedule_overrides enable row level security;
drop policy if exists "overrides public read" on public.stylist_schedule_overrides;
create policy "overrides public read" on public.stylist_schedule_overrides
  for select using (true);
drop policy if exists "overrides owner write" on public.stylist_schedule_overrides;
create policy "overrides owner write" on public.stylist_schedule_overrides
  for all using (exists (select 1 from public.stylists s where s.id = stylist_schedule_overrides.stylist_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from public.stylists s where s.id = stylist_schedule_overrides.stylist_id and s.profile_id = auth.uid()));

-- =========================================================
-- per-stylist booking policies
-- =========================================================
create table if not exists public.stylist_policies (
  stylist_id uuid primary key references public.stylists(id) on delete cascade,
  cancellation_hours integer not null default 24,
  late_grace_min integer not null default 15,
  no_show_fee_percent integer not null default 50,
  deposit_refundable boolean not null default false,
  custom_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.stylist_policies enable row level security;
drop policy if exists "policies public read" on public.stylist_policies;
create policy "policies public read" on public.stylist_policies
  for select using (true);
drop policy if exists "policies owner write" on public.stylist_policies;
create policy "policies owner write" on public.stylist_policies
  for all using (exists (select 1 from public.stylists s where s.id = stylist_policies.stylist_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from public.stylists s where s.id = stylist_policies.stylist_id and s.profile_id = auth.uid()));
drop trigger if exists update_stylist_policies_updated_at on public.stylist_policies;
create trigger update_stylist_policies_updated_at
  before update on public.stylist_policies
  for each row execute function public.update_updated_at_column();

-- =========================================================
-- promotions — vendor marketing offers (suggested by Kichana, run by vendor)
-- =========================================================
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  title text not null,
  kind text not null default 'seasonal',
  discount_percent integer not null default 10,
  audience text not null default 'all',
  starts_on date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_promotions_stylist on public.promotions(stylist_id);
alter table public.promotions enable row level security;
drop policy if exists "promotions public read active" on public.promotions;
create policy "promotions public read active" on public.promotions
  for select using (true);
drop policy if exists "promotions owner write" on public.promotions;
create policy "promotions owner write" on public.promotions
  for all using (exists (select 1 from public.stylists s where s.id = promotions.stylist_id and s.profile_id = auth.uid()))
  with check (exists (select 1 from public.stylists s where s.id = promotions.stylist_id and s.profile_id = auth.uid()));

-- =========================================================
-- profiles — marketing consent (offers only reach opted-in customers)
-- =========================================================
alter table public.profiles
  add column if not exists marketing_opt_in boolean not null default true;
