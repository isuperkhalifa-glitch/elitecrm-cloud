-- EliteCRM V8.5 Sales Calls Center
-- Run this file in Supabase SQL Editor after deployment.

create extension if not exists pgcrypto;

alter table public.leads add column if not exists call_sender_id uuid references public.profiles(id) on delete set null;
alter table public.leads add column if not exists call_receiver_id uuid references public.profiles(id) on delete set null;
alter table public.leads add column if not exists connection_type text default 'manual';
alter table public.leads add column if not exists caller_mobile text;
alter table public.leads add column if not exists second_number text;
alter table public.leads add column if not exists system_source text;
alter table public.leads add column if not exists received_at timestamptz;
alter table public.leads add column if not exists call_deadline_at timestamptz;
alter table public.leads add column if not exists call_done_at timestamptz;
alter table public.leads add column if not exists call_done_description text;
alter table public.leads add column if not exists education_level text;
alter table public.leads add column if not exists city text;

alter table public.leads drop constraint if exists leads_connection_type_check;
alter table public.leads add constraint leads_connection_type_check
  check (
    connection_type is null
    or connection_type in ('distributed','ivr','manual','redirected')
  );

update public.leads
set call_receiver_id = coalesce(call_receiver_id, owner_id),
    call_sender_id = coalesce(call_sender_id, assigned_by, intake_by),
    received_at = coalesce(received_at, created_at),
    call_deadline_at = coalesce(call_deadline_at, next_follow_up_at),
    call_done_at = coalesce(call_done_at, last_call_at, last_contact_at),
    call_done_description = coalesce(call_done_description, last_note),
    connection_type = case
      when lead_type = 'redirected' or redirected_date is not null then 'redirected'
      when lower(coalesce(source, '')) like '%ivr%' then 'ivr'
      when coalesce(queue_type, '') = 'manual' then 'manual'
      when owner_id is not null then 'distributed'
      else coalesce(connection_type, 'manual')
    end,
    system_source = coalesce(system_source, queue_type, 'manual')
where call_receiver_id is null
   or call_sender_id is null
   or received_at is null
   or call_deadline_at is null
   or call_done_at is null
   or call_done_description is null
   or connection_type is null
   or system_source is null;

create index if not exists leads_call_receiver_idx
  on public.leads(call_receiver_id, call_deadline_at, call_done_at);
create index if not exists leads_call_sender_idx
  on public.leads(call_sender_id, received_at desc);
create index if not exists leads_call_connection_idx
  on public.leads(connection_type, received_at desc);
create index if not exists leads_call_source_idx
  on public.leads(source, system_source);
create index if not exists leads_call_location_idx
  on public.leads(city, education_level);

create or replace function public.sync_lead_call_center_fields()
returns trigger
language plpgsql
as $$
begin
  new.call_receiver_id := coalesce(new.call_receiver_id, new.owner_id);
  new.call_sender_id := coalesce(new.call_sender_id, new.assigned_by, new.intake_by);
  new.received_at := coalesce(new.received_at, new.created_at, now());
  new.call_deadline_at := coalesce(new.call_deadline_at, new.next_follow_up_at);
  new.call_done_at := coalesce(new.call_done_at, new.last_call_at);
  new.call_done_description := coalesce(new.call_done_description, new.last_note);

  if new.lead_type = 'redirected' or new.redirected_date is not null then
    new.connection_type := 'redirected';
  elsif lower(coalesce(new.source, '')) like '%ivr%' then
    new.connection_type := 'ivr';
  elsif coalesce(new.queue_type, '') = 'manual' then
    new.connection_type := 'manual';
  elsif new.owner_id is not null then
    new.connection_type := coalesce(new.connection_type, 'distributed');
  end if;

  new.system_source := coalesce(new.system_source, new.queue_type, 'manual');
  return new;
end;
$$;

drop trigger if exists leads_sync_call_center_fields on public.leads;
create trigger leads_sync_call_center_fields
before insert or update on public.leads
for each row execute function public.sync_lead_call_center_fields();
