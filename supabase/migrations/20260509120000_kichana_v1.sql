-- Kichana v1 schema
-- Customer + stylist platform with feed, vault, bookings, reviews, loyalty.

create extension if not exists "pgcrypto";

-- =========================================================
-- profiles  (1:1 with auth.users)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer','stylist')),
  neighborhood text,
  language text not null default 'en' check (language in ('en','sw')),
  loyalty_points int not null default 0,
  hair_type text,
  allergies text,
  birthday date,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
-- stylists
-- =========================================================
create table if not exists public.stylists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  bio text,
  hero_image_url text,
  specialties text[] not null default '{}',
  neighborhoods text[] not null default '{}',
  base_location text,
  travels boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  bookings_count int not null default 0,
  verified boolean not null default false,
  featured_until timestamptz,
  commission_rate numeric(4,3) not null default 0.10,
  loyalty_tier text not null default 'bronze' check (loyalty_tier in ('bronze','silver','gold','platinum')),
  instagram text,
  whatsapp text,
  created_at timestamptz not null default now()
);
create index if not exists stylists_neighborhoods_idx on public.stylists using gin (neighborhoods);
create index if not exists stylists_specialties_idx on public.stylists using gin (specialties);

-- =========================================================
-- services
-- =========================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  duration_min int not null default 60,
  price_kes int not null,
  cover_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists services_stylist_idx on public.services(stylist_id);
create index if not exists services_category_idx on public.services(category);

-- =========================================================
-- availability slots (simple model: stylist publishes open slots)
-- =========================================================
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  taken boolean not null default false
);
create index if not exists slots_stylist_idx on public.availability_slots(stylist_id, starts_at);

-- =========================================================
-- bookings
-- =========================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending','confirmed','in_progress','completed','cancelled','no_show')),
  location_type text not null default 'salon' check (location_type in ('salon','home')),
  address text,
  amount_kes int not null,
  deposit_kes int not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','deposit_paid','paid','refunded')),
  mpesa_receipt text,
  notes text,
  group_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists bookings_customer_idx on public.bookings(customer_id);
create index if not exists bookings_stylist_idx on public.bookings(stylist_id);
create index if not exists bookings_scheduled_idx on public.bookings(scheduled_for);

-- =========================================================
-- reviews
-- =========================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists reviews_stylist_idx on public.reviews(stylist_id);

-- =========================================================
-- portfolio (verified after-service photos)
-- =========================================================
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  image_url text not null,
  category text,
  booking_id uuid references public.bookings(id) on delete set null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
-- feed posts (auto-expire after 90 days)
-- =========================================================
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  stylist_id uuid references public.stylists(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  image_url text not null,
  caption text,
  category text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);
create index if not exists feed_posts_recent_idx on public.feed_posts(created_at desc);

create table if not exists public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'heart' check (kind in ('heart','fire','scissors','crown')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, kind)
);

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- vault items (saved hair inspirations)
-- =========================================================
create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  source_post_id uuid references public.feed_posts(id) on delete set null,
  note text,
  category text,
  created_at timestamptz not null default now()
);
create index if not exists vault_owner_idx on public.vault_items(owner_id);

-- =========================================================
-- follows
-- =========================================================
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, stylist_id)
);

-- =========================================================
-- group bookings
-- =========================================================
create table if not exists public.group_bookings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  scheduled_for timestamptz not null,
  invite_code text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- handle_new_user trigger -> auto profile row
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- prune expired feed posts
-- =========================================================
create or replace function public.prune_expired_feed_posts()
returns void language sql as $$
  delete from public.feed_posts where expires_at < now();
$$;

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.stylists enable row level security;
alter table public.services enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_reactions enable row level security;
alter table public.feed_comments enable row level security;
alter table public.vault_items enable row level security;
alter table public.follows enable row level security;
alter table public.group_bookings enable row level security;

-- profiles
create policy "profiles readable by self" on public.profiles for select using (auth.uid() = id);
create policy "profiles public read minimal" on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- stylists (public read)
create policy "stylists public read" on public.stylists for select using (true);
create policy "stylists own write" on public.stylists for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- services (public read; stylist owner write)
create policy "services public read" on public.services for select using (true);
create policy "services owner write" on public.services for all using (
  exists (select 1 from public.stylists s where s.id = services.stylist_id and s.profile_id = auth.uid())
) with check (
  exists (select 1 from public.stylists s where s.id = services.stylist_id and s.profile_id = auth.uid())
);

-- availability
create policy "slots public read" on public.availability_slots for select using (true);
create policy "slots owner write" on public.availability_slots for all using (
  exists (select 1 from public.stylists s where s.id = stylist_id and s.profile_id = auth.uid())
) with check (
  exists (select 1 from public.stylists s where s.id = stylist_id and s.profile_id = auth.uid())
);

-- bookings: customer or stylist
create policy "bookings read participant" on public.bookings for select using (
  auth.uid() = customer_id or
  exists (select 1 from public.stylists s where s.id = bookings.stylist_id and s.profile_id = auth.uid())
);
create policy "bookings insert customer" on public.bookings for insert with check (auth.uid() = customer_id);
create policy "bookings update participant" on public.bookings for update using (
  auth.uid() = customer_id or
  exists (select 1 from public.stylists s where s.id = bookings.stylist_id and s.profile_id = auth.uid())
);

-- reviews
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews insert customer" on public.reviews for insert with check (auth.uid() = customer_id);
create policy "reviews update own" on public.reviews for update using (auth.uid() = customer_id);

-- portfolio
create policy "portfolio public read" on public.portfolio_items for select using (true);
create policy "portfolio owner write" on public.portfolio_items for all using (
  exists (select 1 from public.stylists s where s.id = stylist_id and s.profile_id = auth.uid())
) with check (
  exists (select 1 from public.stylists s where s.id = stylist_id and s.profile_id = auth.uid())
);

-- feed
create policy "feed public read" on public.feed_posts for select using (expires_at > now());
create policy "feed insert author" on public.feed_posts for insert with check (auth.uid() = author_id);
create policy "feed update author" on public.feed_posts for update using (auth.uid() = author_id);
create policy "feed delete author" on public.feed_posts for delete using (auth.uid() = author_id);

create policy "reactions public read" on public.feed_reactions for select using (true);
create policy "reactions write own" on public.feed_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "comments public read" on public.feed_comments for select using (true);
create policy "comments write own" on public.feed_comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- vault
create policy "vault owner all" on public.vault_items for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- follows
create policy "follows public read" on public.follows for select using (true);
create policy "follows write own" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- group bookings
create policy "group public read" on public.group_bookings for select using (true);
create policy "group write host" on public.group_bookings for all using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- =========================================================
-- Storage buckets (created idempotently)
-- =========================================================
insert into storage.buckets (id, name, public)
values
  ('avatars','avatars', true),
  ('feed','feed', true),
  ('portfolio','portfolio', true),
  ('vault','vault', true)
on conflict (id) do nothing;

-- Storage policies (drop+create to be idempotent)
do $$ begin
  -- avatars
  drop policy if exists "public read avatars" on storage.objects;
  drop policy if exists "auth upload avatars" on storage.objects;
  drop policy if exists "auth update avatars" on storage.objects;
  -- feed
  drop policy if exists "public read feed" on storage.objects;
  drop policy if exists "auth upload feed" on storage.objects;
  -- portfolio
  drop policy if exists "public read portfolio" on storage.objects;
  drop policy if exists "auth upload portfolio" on storage.objects;
  -- vault
  drop policy if exists "auth read vault" on storage.objects;
  drop policy if exists "auth upload vault" on storage.objects;
end $$;

create policy "public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "auth upload avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "auth update avatars" on storage.objects for update to authenticated using (bucket_id = 'avatars' and owner = auth.uid());

create policy "public read feed" on storage.objects for select using (bucket_id = 'feed');
create policy "auth upload feed" on storage.objects for insert to authenticated with check (bucket_id = 'feed' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public read portfolio" on storage.objects for select using (bucket_id = 'portfolio');
create policy "auth upload portfolio" on storage.objects for insert to authenticated with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "auth read vault" on storage.objects for select to authenticated using (bucket_id = 'vault' and owner = auth.uid());
create policy "auth upload vault" on storage.objects for insert to authenticated with check (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);
