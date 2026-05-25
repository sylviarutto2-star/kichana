-- Admin gate: emails in the hardcoded list have full read/update on disputes.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid())
      in ('sylviarutto2@gmail.com'),
    false
  );
$$;

drop policy if exists "disputes admin select all" on public.disputes;
create policy "disputes admin select all"
  on public.disputes for select
  using (public.is_admin());

drop policy if exists "disputes admin update" on public.disputes;
create policy "disputes admin update"
  on public.disputes for update
  using (public.is_admin())
  with check (public.is_admin());

create or replace view public.admin_disputes_view
with (security_invoker = true)
as
select
  d.id, d.booking_id, d.customer_id, d.reason, d.description, d.evidence_urls,
  d.status, d.approved_refund_kes, d.admin_note, d.created_at, d.resolved_at,
  b.scheduled_for, b.deposit_kes, b.payment_status, b.refund_status,
  b.paystack_reference,
  p.full_name as customer_name,
  p.phone as customer_phone,
  s.display_name as stylist_name
from public.disputes d
join public.bookings b on b.id = d.booking_id
left join public.profiles p on p.id = d.customer_id
left join public.stylists s on s.id = b.stylist_id;
