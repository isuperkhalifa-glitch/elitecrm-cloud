-- EliteCRM V10.4 Schema Alignment
-- Run once in Supabase SQL Editor.

-- Course IDs are text across courses, leads, and registrations.
-- Older call-center SQL declared call_logs.course_id as uuid, which breaks values such as pmp or excel.
do $$
declare
  current_type text;
begin
  select data_type into current_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'call_logs'
    and column_name = 'course_id';

  if current_type = 'uuid' then
    alter table public.call_logs drop constraint if exists call_logs_course_id_fkey;
    alter table public.call_logs alter column course_id type text using course_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'call_logs'
      and column_name = 'course_id'
      and data_type = 'text'
  ) then
    alter table public.call_logs drop constraint if exists call_logs_course_id_fkey;
    alter table public.call_logs
      add constraint call_logs_course_id_fkey
      foreign key (course_id) references public.courses(id)
      on update cascade on delete set null;
  end if;
end;
$$;

alter table public.leads add column if not exists company_id uuid references public.companies(id) on update cascade on delete set null;
alter table public.leads add column if not exists course_id text references public.courses(id) on update cascade on delete set null;
alter table public.leads add column if not exists customer_status text;
alter table public.leads add column if not exists registration_status text default 'not_registered';
alter table public.leads add column if not exists payment_status text default 'unpaid';
alter table public.leads add column if not exists registration_amount numeric(12,2) default 0;
alter table public.leads add column if not exists discount_amount numeric(12,2) default 0;
alter table public.leads add column if not exists final_amount numeric(12,2) default 0;
alter table public.leads add column if not exists discount_code text;
alter table public.leads add column if not exists paid_amount numeric(12,2) default 0;
