-- EliteCRM V10.4 Archive Protection
-- Run once in Supabase SQL Editor.

create or replace function public.block_operational_hard_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  if auth.role() = 'service_role' then
    return old;
  end if;

  select profile.role into current_role
  from public.profiles profile
  where profile.id = auth.uid();

  if current_role = 'developer' then
    return old;
  end if;

  raise exception 'الحذف النهائي غير مسموح. استخدم الأرشفة بدلًا منه.';
end;
$$;

drop trigger if exists companies_block_hard_delete on public.companies;
create trigger companies_block_hard_delete
before delete on public.companies
for each row execute function public.block_operational_hard_delete();

drop trigger if exists courses_block_hard_delete on public.courses;
create trigger courses_block_hard_delete
before delete on public.courses
for each row execute function public.block_operational_hard_delete();

drop trigger if exists registrations_block_hard_delete on public.registrations;
create trigger registrations_block_hard_delete
before delete on public.registrations
for each row execute function public.block_operational_hard_delete();
