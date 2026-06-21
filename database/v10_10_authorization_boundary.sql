-- EliteCRM V10.10 Authorization Boundary
-- Run once after v10_9_p0_security_hardening.sql.

-- Shared row-access helpers. These functions fail closed when the profile is invalid.
create or replace function public.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks task
    where task.id = p_task_id
      and (
        public.current_app_role() in ('developer','admin','manager')
        or auth.uid() = task.sender_id
        or auth.uid() = task.receiver_id
        or auth.uid() = task.owner_id
        or auth.uid() = task.created_by
      )
  );
$$;

create or replace function public.can_access_lead(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leads lead
    where lead.id = p_lead_id
      and (
        public.current_app_role() in ('developer','admin','manager','moderator','finance','data_analyst')
        or (public.current_app_role() = 'sales' and lead.owner_id = auth.uid())
        or (public.current_app_role() = 'marketer' and lead.intake_by = auth.uid())
      )
  );
$$;

revoke all on function public.can_access_task(uuid) from public, anon;
revoke all on function public.can_access_lead(uuid) from public, anon;
grant execute on function public.can_access_task(uuid) to authenticated, service_role;
grant execute on function public.can_access_lead(uuid) to authenticated, service_role;

-- Tasks and internal requests.
alter table public.tasks enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'tasks'
  loop
    execute format('drop policy if exists %I on public.tasks', policy_row.policyname);
  end loop;
end $$;

create policy tasks_scoped_select
  on public.tasks for select
  to authenticated
  using (public.can_access_task(id));

create policy tasks_scoped_insert
  on public.tasks for insert
  to authenticated
  with check (
    public.current_app_role() in ('developer','admin','manager','moderator','marketer','sales','finance')
    and (sender_id is null or sender_id = auth.uid())
    and (created_by is null or created_by = auth.uid())
  );

create policy tasks_scoped_update
  on public.tasks for update
  to authenticated
  using (
    public.current_app_role() in ('developer','admin','manager')
    or (
      public.current_app_role() in ('moderator','marketer','sales','finance')
      and public.can_access_task(id)
    )
  )
  with check (
    public.current_app_role() in ('developer','admin','manager')
    or (
      public.current_app_role() in ('moderator','marketer','sales','finance')
      and public.can_access_task(id)
    )
  );

-- No DELETE policy: V10.9 also blocks hard deletion with a trigger.

-- Request activity history.
alter table public.request_activity_logs enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'request_activity_logs'
  loop
    execute format('drop policy if exists %I on public.request_activity_logs', policy_row.policyname);
  end loop;
end $$;

create policy request_activity_scoped_select
  on public.request_activity_logs for select
  to authenticated
  using (public.can_access_task(task_id));

create policy request_activity_scoped_insert
  on public.request_activity_logs for insert
  to authenticated
  with check (
    public.current_app_role() in ('developer','admin','manager','moderator','marketer','sales','finance')
    and actor_id = auth.uid()
    and public.can_access_task(task_id)
  );

-- Call history.
alter table public.call_logs enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'call_logs'
  loop
    execute format('drop policy if exists %I on public.call_logs', policy_row.policyname);
  end loop;
end $$;

create policy call_logs_scoped_select
  on public.call_logs for select
  to authenticated
  using (
    public.current_app_role() in ('developer','admin','manager','moderator','data_analyst')
    or actor_id = auth.uid()
    or public.can_access_lead(lead_id)
  );

create policy call_logs_scoped_insert
  on public.call_logs for insert
  to authenticated
  with check (
    public.current_app_role() in ('developer','admin','manager','moderator','sales')
    and actor_id = auth.uid()
    and public.can_access_lead(lead_id)
  );

-- Customer timeline.
alter table public.customer_activities enable row level security;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'customer_activities'
  loop
    execute format('drop policy if exists %I on public.customer_activities', policy_row.policyname);
  end loop;
end $$;

create policy customer_activities_scoped_select
  on public.customer_activities for select
  to authenticated
  using (
    actor_id = auth.uid()
    or public.can_access_lead(lead_id)
  );

create policy customer_activities_scoped_insert
  on public.customer_activities for insert
  to authenticated
  with check (
    public.current_app_role() in ('developer','admin','manager','moderator','marketer','sales')
    and actor_id = auth.uid()
    and public.can_access_lead(lead_id)
  );

-- Activity history is append-only: no UPDATE or DELETE policies.
