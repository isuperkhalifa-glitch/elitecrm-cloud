-- EliteCRM V8.2 Home Dashboard
-- Run this file in Supabase SQL Editor after deployment.

create extension if not exists pgcrypto;

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  sales_id uuid references public.profiles(id) on delete set null,
  call_status text,
  duration_seconds integer default 0,
  note text,
  created_at timestamptz not null default now()
);

alter table public.call_logs add column if not exists actor_id uuid references public.profiles(id) on delete set null;
alter table public.call_logs add column if not exists actor_name text;
alter table public.call_logs add column if not exists outcome text;
alter table public.call_logs add column if not exists course_id uuid references public.courses(id) on delete set null;
alter table public.call_logs add column if not exists next_follow_up_at timestamptz;
alter table public.call_logs add column if not exists duration_minutes integer;
alter table public.call_logs add column if not exists sales_id uuid references public.profiles(id) on delete set null;
alter table public.call_logs add column if not exists call_status text;
alter table public.call_logs add column if not exists duration_seconds integer default 0;

update public.call_logs
set actor_id = coalesce(actor_id, sales_id),
    sales_id = coalesce(sales_id, actor_id),
    outcome = coalesce(
      outcome,
      case
        when lower(coalesce(call_status, '')) in ('missed','no_answer','no reply') then 'missed'
        when lower(coalesce(call_status, '')) in ('wrong_number','wrong number') then 'wrong_number'
        when lower(coalesce(call_status, '')) in ('paid','converted') then 'paid'
        when lower(coalesce(call_status, '')) = 'busy' then 'busy'
        else 'interested'
      end
    ),
    call_status = coalesce(
      call_status,
      case when outcome = 'missed' then 'missed' else 'connected' end
    ),
    duration_minutes = coalesce(
      duration_minutes,
      ceil(coalesce(duration_seconds, 0) / 60.0)::integer
    ),
    duration_seconds = coalesce(
      duration_seconds,
      coalesce(duration_minutes, 0) * 60,
      0
    );

create or replace function public.sync_call_log_compatibility()
returns trigger
language plpgsql
as $$
begin
  new.actor_id := coalesce(new.actor_id, new.sales_id);
  new.sales_id := coalesce(new.sales_id, new.actor_id);
  new.outcome := coalesce(
    new.outcome,
    case
      when lower(coalesce(new.call_status, '')) in ('missed','no_answer','no reply') then 'missed'
      when lower(coalesce(new.call_status, '')) in ('wrong_number','wrong number') then 'wrong_number'
      when lower(coalesce(new.call_status, '')) in ('paid','converted') then 'paid'
      when lower(coalesce(new.call_status, '')) = 'busy' then 'busy'
      else 'interested'
    end
  );
  new.call_status := coalesce(
    new.call_status,
    case when new.outcome = 'missed' then 'missed' else 'connected' end
  );
  new.duration_minutes := coalesce(
    new.duration_minutes,
    ceil(coalesce(new.duration_seconds, 0) / 60.0)::integer
  );
  new.duration_seconds := coalesce(
    new.duration_seconds,
    coalesce(new.duration_minutes, 0) * 60,
    0
  );
  return new;
end;
$$;

drop trigger if exists call_logs_compatibility_trigger on public.call_logs;
create trigger call_logs_compatibility_trigger
before insert or update on public.call_logs
for each row execute function public.sync_call_log_compatibility();

create index if not exists call_logs_actor_created_idx
  on public.call_logs(actor_id, created_at desc);
create index if not exists call_logs_sales_created_idx
  on public.call_logs(sales_id, created_at desc);
create index if not exists call_logs_outcome_created_idx
  on public.call_logs(outcome, created_at desc);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  check_in_at timestamptz,
  check_out_at timestamptz,
  source text default 'system',
  created_at timestamptz not null default now()
);

alter table public.attendance_logs
  add column if not exists activity_count integer default 0;

create index if not exists attendance_logs_user_created_idx
  on public.attendance_logs(user_id, created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_role text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements
  add column if not exists created_by_name text;
alter table public.announcements
  add column if not exists pinned boolean not null default false;
alter table public.announcements
  add column if not exists expires_at timestamptz;

create index if not exists announcements_dashboard_idx
  on public.announcements(is_active, pinned desc, created_at desc);