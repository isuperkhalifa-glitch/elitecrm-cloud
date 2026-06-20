-- Run after v10_6_write_permissions.sql

drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads for select to authenticated
using (public.current_app_role() <> 'sales' or owner_id = auth.uid());

drop policy if exists registrations_read on public.registrations;
create policy registrations_read on public.registrations for select to authenticated
using (
  public.current_app_role() in ('developer','admin','manager','moderator','finance','data_analyst')
  or (public.current_app_role() = 'sales' and sales_id = auth.uid())
);
