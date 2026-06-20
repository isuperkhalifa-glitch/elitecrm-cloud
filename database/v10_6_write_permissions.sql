-- EliteCRM V10.6 Write Permissions
-- Run once in Supabase SQL Editor after V10.4 migrations.

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'sales');
$$;

create or replace function public.guard_profile_sensitive_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.role() = 'service_role' then return new; end if;
  actor_role := public.current_app_role();

  if actor_role not in ('developer', 'admin') then
    raise exception 'لا تملك صلاحية تعديل المستخدمين.';
  end if;

  if actor_role = 'admin' and (old.role = 'developer' or new.role = 'developer') then
    raise exception 'تعديل صلاحية مطور النظام متاح لمطور النظام فقط.';
  end if;

  if old.id = auth.uid() and (new.role is distinct from old.role or new.is_active = false) then
    raise exception 'لا يمكنك تغيير صلاحية حسابك الحالي أو إيقافه.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive_update on public.profiles;
create trigger profiles_guard_sensitive_update
before update on public.profiles
for each row execute function public.guard_profile_sensitive_update();

create or replace function public.guard_registration_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  if auth.role() = 'service_role' then return new; end if;
  actor_role := public.current_app_role();

  if actor_role = 'finance' then
    if new.lead_id is distinct from old.lead_id
       or new.company_id is distinct from old.company_id
       or new.course_id is distinct from old.course_id
       or new.sales_id is distinct from old.sales_id
       or new.status is distinct from old.status
       or new.list_price is distinct from old.list_price
       or new.discount_amount is distinct from old.discount_amount
       or new.final_price is distinct from old.final_price
       or new.discount_code is distinct from old.discount_code then
      raise exception 'الحسابات يمكنها تعديل حالة الدفع والمبلغ المدفوع والملاحظات فقط.';
    end if;
  end if;

  if actor_role = 'sales' and old.sales_id is distinct from auth.uid() then
    raise exception 'لا يمكنك تعديل تسجيل لا يخصك.';
  end if;

  return new;
end;
$$;

drop trigger if exists registrations_guard_update on public.registrations;
create trigger registrations_guard_update
before update on public.registrations
for each row execute function public.guard_registration_update();

-- Remove older broad policies so role-specific policies are effective.
do $$
declare
  table_name text;
  policy_row record;
begin
  foreach table_name in array array['profiles','companies','courses','registrations','commissions','leads'] loop
    for policy_row in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_row.policyname, table_name);
    end loop;
  end loop;
end;
$$;

alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_admin_insert on public.profiles for insert to authenticated
  with check (public.current_app_role() in ('developer','admin'));
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.current_app_role() in ('developer','admin'))
  with check (public.current_app_role() in ('developer','admin'));
create policy profiles_developer_delete on public.profiles for delete to authenticated
  using (public.current_app_role() = 'developer');

alter table public.companies enable row level security;
create policy companies_read on public.companies for select to authenticated using (true);
create policy companies_manage_insert on public.companies for insert to authenticated
  with check (public.current_app_role() in ('developer','admin','manager'));
create policy companies_manage_update on public.companies for update to authenticated
  using (public.current_app_role() in ('developer','admin','manager'))
  with check (public.current_app_role() in ('developer','admin','manager'));
create policy companies_manage_delete on public.companies for delete to authenticated
  using (public.current_app_role() = 'developer');

alter table public.courses enable row level security;
create policy courses_read on public.courses for select to authenticated using (true);
create policy courses_manage_insert on public.courses for insert to authenticated
  with check (public.current_app_role() in ('developer','admin','manager'));
create policy courses_manage_update on public.courses for update to authenticated
  using (public.current_app_role() in ('developer','admin','manager'))
  with check (public.current_app_role() in ('developer','admin','manager'));
create policy courses_manage_delete on public.courses for delete to authenticated
  using (public.current_app_role() = 'developer');

alter table public.registrations enable row level security;
create policy registrations_read on public.registrations for select to authenticated using (true);
create policy registrations_insert on public.registrations for insert to authenticated
  with check (
    public.current_app_role() in ('developer','admin','manager','moderator')
    or (public.current_app_role() = 'sales' and sales_id = auth.uid())
  );
create policy registrations_update on public.registrations for update to authenticated
  using (
    public.current_app_role() in ('developer','admin','manager','moderator','finance')
    or (public.current_app_role() = 'sales' and sales_id = auth.uid())
  )
  with check (
    public.current_app_role() in ('developer','admin','manager','moderator','finance')
    or (public.current_app_role() = 'sales' and sales_id = auth.uid())
  );
create policy registrations_delete on public.registrations for delete to authenticated
  using (public.current_app_role() = 'developer');

alter table public.commissions enable row level security;
create policy commissions_read on public.commissions for select to authenticated
  using (
    public.current_app_role() in ('developer','admin','manager','finance','data_analyst')
    or (public.current_app_role() = 'sales' and sales_id = auth.uid())
  );
create policy commissions_insert on public.commissions for insert to authenticated
  with check (public.current_app_role() in ('developer','admin'));
create policy commissions_update on public.commissions for update to authenticated
  using (public.current_app_role() in ('developer','admin','finance'))
  with check (public.current_app_role() in ('developer','admin','finance'));
create policy commissions_delete on public.commissions for delete to authenticated
  using (public.current_app_role() = 'developer');

alter table public.leads enable row level security;
create policy leads_read on public.leads for select to authenticated using (true);
create policy leads_insert on public.leads for insert to authenticated
  with check (public.current_app_role() in ('developer','admin','manager','moderator','marketer'));
create policy leads_update on public.leads for update to authenticated
  using (
    public.current_app_role() in ('developer','admin','manager','moderator')
    or (public.current_app_role() = 'sales' and owner_id = auth.uid())
    or (public.current_app_role() = 'marketer' and intake_by = auth.uid())
  )
  with check (
    public.current_app_role() in ('developer','admin','manager','moderator')
    or (public.current_app_role() = 'sales' and owner_id = auth.uid())
    or (public.current_app_role() = 'marketer' and intake_by = auth.uid())
  );
create policy leads_delete on public.leads for delete to authenticated
  using (public.current_app_role() = 'developer');
