-- Pre-launch waitlist for customers and stylists.

create table public.waitlist_customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  sms_opt_in boolean not null default false,
  email_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index waitlist_customers_email_key on public.waitlist_customers (lower(email));

create table public.waitlist_stylists (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  area text not null,
  services text[] not null default '{}',
  years_experience int,
  work_mode text check (work_mode in ('home','salon','both')),
  instagram_url text,
  created_at timestamptz not null default now()
);
create unique index waitlist_stylists_email_key on public.waitlist_stylists (lower(email));

alter table public.waitlist_customers enable row level security;
alter table public.waitlist_stylists  enable row level security;

create policy "anon can join customer waitlist"
  on public.waitlist_customers for insert to anon, authenticated with check (true);

create policy "anon can join stylist waitlist"
  on public.waitlist_stylists for insert to anon, authenticated with check (true);
