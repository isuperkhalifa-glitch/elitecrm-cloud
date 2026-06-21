-- EliteCRM V10.5 Operational Integrity
-- Run once in Supabase SQL Editor after deploying the matching application patch.

create extension if not exists pgcrypto;

alter table public.leads add column if not exists country_code text;
alter table public.leads add column if not exists phone_number text;
alter table public.leads add column if not exists lead_type text default 'fresh';
alter table public.leads add column if not exists operation_status text default 'ready_for_distribution';
alter table public.leads add column if not exists pending_operation_dist boolean not null default false;
alter table public.leads add column if not exists redirected_date timestamptz;
alter table public.leads add column if not exists queue_type text default 'manual';
alter table public.leads add column if not exists connection_type text;
alter table public.leads add column if not exists assigned_at timestamptz;
alter table public.leads add column if not exists assigned_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.leads add column if not exists status_updated_at timestamptz;

alter table public.leads alter column operation_status set default 'ready_for_distribution';
alter table public.leads alter column pending_operation_dist set default false;

alter table public.import_batches add column if not exists new_fresh_inserted integer not null default 0;
alter table public.import_batches add column if not exists duplicates_inserted_as_retargeted integer not null default 0;

-- Redirected is a distribution bucket, not a lead type.
update public.leads
set lead_type = 'retargeted'
where lead_type = 'redirected';

alter table public.leads drop constraint if exists leads_lead_type_check;
alter table public.leads add constraint leads_lead_type_check
  check (lead_type is null or lead_type in ('fresh', 'retargeted', 'rejected'));

create or replace function public.prepare_imported_lead()
returns trigger
language plpgsql
as $$
declare
  phone_key text;
  duplicate_exists boolean := false;
begin
  phone_key := regexp_replace(
    coalesce(
      nullif(new.phone, ''),
      coalesce(new.country_code, '') || coalesce(new.phone_number, '')
    ),
    '[^0-9]',
    '',
    'g'
  );

  if nullif(new.phone, '') is null and phone_key <> '' then
    new.phone := phone_key;
  end if;

  if nullif(new.external_id, '') is null and phone_key <> '' then
    new.external_id := 'phone:' || phone_key;
  end if;

  -- Existing imports use UPSERT on external_id. Convert the UPDATE branch into
  -- a brand-new immutable interaction row and cancel the historical update.
  if tg_op = 'UPDATE'
     and new.import_batch_id is not null
     and new.import_batch_id is distinct from old.import_batch_id then
    new.id := gen_random_uuid();
    new.created_at := now();
    new.external_id := coalesce(
      nullif(btrim(new.external_id), ''),
      nullif('phone:' || phone_key, 'phone:'),
      'interaction'
    ) || ':interaction:' || gen_random_uuid()::text;
    new.lead_type := 'retargeted';
    new.operation_status := 'pending_operation_dist';
    new.pending_operation_dist := true;
    new.owner_id := null;
    new.assigned_by := null;
    new.assigned_at := null;
    new.redirected_date := null;
    new.connection_type := null;
    new.queue_type := 'retargeting';

    insert into public.leads
    select new.*;

    return null;
  end if;

  if tg_op = 'INSERT' and new.import_batch_id is not null and phone_key <> '' then
    select exists (
      select 1
      from public.leads existing
      where regexp_replace(
        coalesce(
          nullif(existing.phone, ''),
          coalesce(existing.country_code, '') || coalesce(existing.phone_number, '')
        ),
        '[^0-9]',
        '',
        'g'
      ) = phone_key
    )
    into duplicate_exists;

    if duplicate_exists then
      new.lead_type := 'retargeted';
      new.operation_status := 'pending_operation_dist';
      new.pending_operation_dist := true;
      new.owner_id := null;
      new.assigned_by := null;
      new.assigned_at := null;
      new.redirected_date := null;
      new.connection_type := null;
      new.queue_type := 'retargeting';
    else
      new.lead_type := coalesce(nullif(new.lead_type, ''), 'fresh');
      if new.lead_type <> 'rejected' then
        new.lead_type := 'fresh';
      end if;
      new.operation_status := coalesce(nullif(new.operation_status, ''), 'ready_for_distribution');
      new.pending_operation_dist := false;
      new.queue_type := coalesce(nullif(new.queue_type, ''), 'import');
    end if;
  end if;

  if coalesce(new.customer_status, new.status) = 'wrong_number' then
    new.lead_type := 'rejected';
    new.pending_operation_dist := false;
    new.operation_status := 'completed';
  end if;

  return new;
end;
$$;

drop trigger if exists leads_prepare_import on public.leads;
create trigger leads_prepare_import
before insert or update on public.leads
for each row execute function public.prepare_imported_lead();

-- The current distribution endpoint already updates owner_id. This trigger
-- converts that existing action into a real redirection execution when the row
-- is retargeted, without auto-distributing it during upload.
create or replace function public.apply_distribution_state()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is not null and new.owner_id is distinct from old.owner_id then
    new.assigned_at := coalesce(new.assigned_at, now());
    new.pending_operation_dist := false;
    new.operation_status := 'distributed';

    if new.lead_type = 'retargeted' then
      new.redirected_date := now();
      new.connection_type := 'redirected';
      new.queue_type := 'retargeting';
    else
      new.connection_type := 'distributed';
    end if;
  elsif new.owner_id is null and old.owner_id is not null then
    if new.lead_type = 'retargeted' and new.redirected_date is null then
      new.pending_operation_dist := true;
      new.operation_status := 'pending_operation_dist';
      new.connection_type := null;
    else
      new.operation_status := 'ready_for_distribution';
      new.connection_type := 'manual';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_apply_distribution_state on public.leads;
create trigger leads_apply_distribution_state
before update of owner_id on public.leads
for each row execute function public.apply_distribution_state();

create or replace function public.track_import_batch_summary()
returns trigger
language plpgsql
as $$
begin
  if new.import_batch_id is null then
    return new;
  end if;

  update public.import_batches
  set
    new_fresh_inserted = new_fresh_inserted + case when new.lead_type = 'fresh' then 1 else 0 end,
    duplicates_inserted_as_retargeted = duplicates_inserted_as_retargeted + case when new.lead_type = 'retargeted' then 1 else 0 end,
    updated_at = now()
  where id = new.import_batch_id;

  return new;
end;
$$;

drop trigger if exists leads_track_import_batch_summary on public.leads;
create trigger leads_track_import_batch_summary
after insert on public.leads
for each row execute function public.track_import_batch_summary();

create or replace function public.enforce_wrong_number_rejection()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.customer_status, new.status) = 'wrong_number' then
    new.lead_type := 'rejected';
    new.pending_operation_dist := false;
    new.operation_status := 'completed';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_wrong_number_rejection on public.leads;
create trigger leads_wrong_number_rejection
before insert or update of status, customer_status
on public.leads
for each row execute function public.enforce_wrong_number_rejection();

create index if not exists leads_retargeting_pool_idx
  on public.leads(operation_status, created_at)
  where lead_type = 'retargeted' and pending_operation_dist = true;

create index if not exists leads_redirected_date_idx
  on public.leads(redirected_date desc)
  where redirected_date is not null;
