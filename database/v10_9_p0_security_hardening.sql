-- EliteCRM V10.9 P0 Security and Data Integrity Hardening
-- Run once after v10_8_notifications_engine.sql.

-- Fail closed: missing, inactive, or invalid profiles have no application role.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when profile.is_active = true
       and profile.role in ('developer','admin','manager','moderator','marketer','sales','finance','data_analyst')
        then profile.role
      else 'blocked'
    end
    from public.profiles profile
    where profile.id = auth.uid()
  ), 'blocked');
$$;

-- Notification creation is server/trigger only. Users can only read and mark their own rows.
revoke all on function public.notify_active_roles(
  text[], text, text, uuid, text, text, text, text, text, text, uuid[]
) from public, anon, authenticated;
grant execute on function public.notify_active_roles(
  text[], text, text, uuid, text, text, text, text, text, text, uuid[]
) to service_role;

alter table public.notifications enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'notifications'
  loop
    execute format('drop policy if exists %I on public.notifications', policy_row.policyname);
  end loop;
end $$;

create policy notifications_owner_select
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy notifications_owner_update
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.guard_notification_owner_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() is null or old.user_id <> auth.uid() or new.user_id <> old.user_id then
    raise exception 'لا يمكنك تعديل إشعار لا يخصك.';
  end if;

  if new.type is distinct from old.type
     or new.entity_type is distinct from old.entity_type
     or new.entity_id is distinct from old.entity_id
     or new.action is distinct from old.action
     or new.title is distinct from old.title
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at
     or new.source_url is distinct from old.source_url
     or new.priority is distinct from old.priority
     or new.recipient_role is distinct from old.recipient_role
     or new.dedupe_key is distinct from old.dedupe_key then
    raise exception 'المسموح فقط هو تغيير حالة قراءة الإشعار.';
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_guard_owner_update on public.notifications;
create trigger notifications_guard_owner_update
before update on public.notifications
for each row execute function public.guard_notification_owner_update();

-- Payments: remove the historical authenticated-for-all policy.
alter table public.payments enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'payments'
  loop
    execute format('drop policy if exists %I on public.payments', policy_row.policyname);
  end loop;
end $$;

create policy payments_role_read
  on public.payments for select
  to authenticated
  using (
    public.current_app_role() in ('developer','admin','manager','finance','data_analyst')
    or (
      public.current_app_role() = 'sales'
      and (
        exists (
          select 1 from public.registrations registration
          where registration.id = payments.registration_id
            and registration.sales_id = auth.uid()
        )
        or exists (
          select 1 from public.leads lead
          where lead.id = payments.lead_id
            and lead.owner_id = auth.uid()
        )
      )
    )
  );

create policy payments_finance_insert
  on public.payments for insert
  to authenticated
  with check (
    public.current_app_role() in ('developer','admin','finance')
    and (created_by is null or created_by = auth.uid())
  );

create policy payments_finance_update
  on public.payments for update
  to authenticated
  using (public.current_app_role() in ('developer','admin','finance'))
  with check (public.current_app_role() in ('developer','admin','finance'));

create policy payments_developer_delete
  on public.payments for delete
  to authenticated
  using (public.current_app_role() = 'developer');

-- Internal requests and calendar events are never hard-deleted from the application.
create or replace function public.block_task_hard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'الحذف النهائي للمهام والطلبات غير مسموح. استخدم الإلغاء أو الأرشفة.';
end;
$$;

drop trigger if exists tasks_block_hard_delete on public.tasks;
create trigger tasks_block_hard_delete
before delete on public.tasks
for each row execute function public.block_task_hard_delete();

-- A lead cannot become paid unless a real paid registration already exists.
create or replace function public.guard_lead_paid_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  became_paid boolean := false;
begin
  if tg_op = 'INSERT' then
    became_paid := coalesce(new.status, '') = 'paid'
      or coalesce(new.customer_status, '') = 'paid'
      or coalesce(new.payment_status, '') = 'paid';
  else
    became_paid :=
      (coalesce(new.status, '') = 'paid' and coalesce(old.status, '') <> 'paid')
      or (coalesce(new.customer_status, '') = 'paid' and coalesce(old.customer_status, '') <> 'paid')
      or (coalesce(new.payment_status, '') = 'paid' and coalesce(old.payment_status, '') <> 'paid');
  end if;

  if became_paid and not exists (
    select 1
    from public.registrations registration
    where registration.lead_id = new.id
      and coalesce(registration.status, '') <> 'canceled'
      and registration.payment_status = 'paid'
      and coalesce(registration.paid_amount, 0) > 0
      and coalesce(registration.paid_amount, 0) >= coalesce(registration.final_price, 0)
  ) then
    raise exception 'لا يمكن تحويل العميل إلى سدد بدون تسجيل مدفوع موثق.';
  end if;

  return new;
end;
$$;

drop trigger if exists leads_guard_paid_transition on public.leads;
create trigger leads_guard_paid_transition
before insert or update of status, customer_status, payment_status
on public.leads
for each row execute function public.guard_lead_paid_transition();
