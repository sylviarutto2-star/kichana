-- Disputes + refund tracking for the launch cancel flow.
--
-- Cancel-with-refund window: within 1h of booking creation OR more than 4h
-- before the scheduled time. Outside that, customers can file a dispute,
-- which we review and refund manually via the process-dispute-refund edge fn.

-- 1. bookings: refund tracking columns
alter table public.bookings
  add column if not exists refund_status text
    check (refund_status in ('none','pending','refunded','denied'))
    not null default 'none',
  add column if not exists refund_kes integer,
  add column if not exists paystack_refund_id text,
  add column if not exists refund_processed_at timestamptz;

create index if not exists bookings_refund_status_idx
  on public.bookings (refund_status)
  where refund_status <> 'none';

-- 2. disputes
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  reason text not null
    check (reason in ('stylist_no_show','service_not_delivered','health_emergency','other')),
  description text not null check (length(trim(description)) >= 10),
  evidence_urls text[] not null default '{}'::text[],
  status text not null default 'open'
    check (status in ('open','approved','rejected')),
  approved_refund_kes integer,
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (booking_id)
);

create index if not exists disputes_status_idx on public.disputes(status);
create index if not exists disputes_customer_idx on public.disputes(customer_id);

alter table public.disputes enable row level security;

-- Customers see only their own disputes
drop policy if exists "disputes select own" on public.disputes;
create policy "disputes select own"
  on public.disputes for select
  using (auth.uid() = customer_id);

-- Customers can file a dispute only on their own cancelled booking that
-- isn't already refunded, and only when no dispute exists yet.
drop policy if exists "disputes insert own" on public.disputes;
create policy "disputes insert own"
  on public.disputes for insert
  with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.status = 'cancelled'
        and b.refund_status in ('none','denied')
    )
  );

-- 3. Storage bucket for dispute evidence (photos). Private — signed URLs only.
insert into storage.buckets (id, name, public)
values ('dispute-evidence', 'dispute-evidence', false)
on conflict (id) do nothing;

drop policy if exists "dispute evidence upload own folder" on storage.objects;
create policy "dispute evidence upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dispute-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dispute evidence read own folder" on storage.objects;
create policy "dispute evidence read own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'dispute-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
