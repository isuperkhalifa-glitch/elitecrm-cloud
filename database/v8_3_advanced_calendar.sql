-- EliteCRM V8.3 Advanced Calendar
-- Run this file in Supabase SQL Editor after deployment.

alter table public.tasks
  add column if not exists event_type text default 'task';

alter table public.tasks
  add column if not exists all_day boolean not null default false;

alter table public.tasks
  add column if not exists completed_at timestamptz;

alter table public.tasks
  add column if not exists updated_at timestamptz not null default now();

alter table public.tasks
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.tasks
  drop constraint if exists tasks_event_type_check;

alter table public.tasks
  add constraint tasks_event_type_check
  check (
    event_type is null
    or event_type in ('call', 'meeting', 'task')
  );

update public.tasks
set event_type = case
  when lower(coalesce(title, '')) like '%meeting%'
    or coalesce(title, '') like '%اجتماع%'
    or coalesce(title, '') like '%مقابلة%'
    then 'meeting'
  when lower(coalesce(title, '')) like '%call%'
    or coalesce(title, '') like '%اتصال%'
    or coalesce(title, '') like '%مكالمة%'
    then 'call'
  else coalesce(event_type, 'task')
end
where event_type is null
   or event_type = 'task';

update public.tasks
set completed_at = coalesce(completed_at, updated_at, created_at, now())
where status in ('done', 'completed', 'closed', 'finished')
  and completed_at is null;

create index if not exists tasks_calendar_due_idx
  on public.tasks(due_date, owner_id, event_type);

create index if not exists tasks_calendar_status_idx
  on public.tasks(status, due_date);

create index if not exists tasks_calendar_related_idx
  on public.tasks(related_type, related_id);

create or replace function public.touch_task_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.status in ('done', 'completed', 'closed', 'finished')
     and old.status is distinct from new.status
     and new.completed_at is null then
    new.completed_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;

create trigger tasks_touch_updated_at
before update on public.tasks
for each row execute function public.touch_task_updated_at();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'system',
  entity_type text,
  entity_id uuid,
  action text,
  title text,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_calendar_user_idx
  on public.notifications(user_id, is_read, created_at desc);
