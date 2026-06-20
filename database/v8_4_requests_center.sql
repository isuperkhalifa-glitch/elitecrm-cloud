-- EliteCRM V8.4 Internal Requests Center
-- Run this file in Supabase SQL Editor after deployment.

create extension if not exists pgcrypto;

alter table public.tasks add column if not exists sender_id uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists receiver_id uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists request_code text;
alter table public.tasks add column if not exists request_type text default 'other';
alter table public.tasks add column if not exists result_type text;
alter table public.tasks add column if not exists started_at timestamptz;
alter table public.tasks add column if not exists done_at timestamptz;
alter table public.tasks add column if not exists done_description text;
alter table public.tasks add column if not exists updated_at timestamptz not null default now();
alter table public.tasks add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists event_type text default 'task';

update public.tasks
set receiver_id = coalesce(receiver_id, owner_id),
    sender_id = coalesce(sender_id, created_by),
    done_at = coalesce(done_at, completed_at),
    request_type = coalesce(request_type, 'other'),
    event_type = coalesce(event_type, 'task')
where receiver_id is null
   or sender_id is null
   or done_at is null
   or request_type is null
   or event_type is null;

alter table public.tasks drop constraint if exists tasks_request_type_check;
alter table public.tasks add constraint tasks_request_type_check
  check (
    request_type is null
    or request_type in ('complete_documents','registration','meeting','call','follow_up','other')
  );

alter table public.tasks drop constraint if exists tasks_result_type_check;
alter table public.tasks add constraint tasks_result_type_check
  check (
    result_type is null
    or result_type in ('completed','rejected','needs_information','forwarded')
  );

create unique index if not exists tasks_request_code_unique_idx
  on public.tasks(request_code)
  where request_code is not null;

create index if not exists tasks_requests_receiver_idx
  on public.tasks(receiver_id, status, due_date desc);
create index if not exists tasks_requests_sender_idx
  on public.tasks(sender_id, created_at desc);
create index if not exists tasks_requests_type_idx
  on public.tasks(request_type, status, due_date desc);

create table if not exists public.request_activity_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  action text not null,
  old_status text,
  new_status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists request_activity_task_idx
  on public.request_activity_logs(task_id, created_at desc);
create index if not exists request_activity_actor_idx
  on public.request_activity_logs(actor_id, created_at desc);

create or replace function public.sync_internal_request_fields()
returns trigger
language plpgsql
as $$
begin
  new.receiver_id := coalesce(new.receiver_id, new.owner_id);
  new.owner_id := coalesce(new.owner_id, new.receiver_id);
  new.sender_id := coalesce(new.sender_id, new.created_by);
  new.created_by := coalesce(new.created_by, new.sender_id);
  new.updated_at := now();

  if new.status = 'in_progress' and new.started_at is null then
    new.started_at := now();
  end if;

  if new.status in ('done','completed','closed','finished') then
    new.done_at := coalesce(new.done_at, now());
    new.completed_at := coalesce(new.completed_at, new.done_at, now());
  end if;

  if new.request_type = 'meeting' then
    new.event_type := 'meeting';
  elsif new.request_type = 'call' then
    new.event_type := 'call';
  else
    new.event_type := coalesce(new.event_type, 'task');
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_sync_internal_request_fields on public.tasks;
create trigger tasks_sync_internal_request_fields
before insert or update on public.tasks
for each row execute function public.sync_internal_request_fields();

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

create index if not exists notifications_requests_user_idx
  on public.notifications(user_id, is_read, created_at desc);
