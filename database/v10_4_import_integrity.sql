-- EliteCRM V10.4 Import Integrity
-- Run once in Supabase SQL Editor.

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  entity_type text not null default 'leads',
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  failed_rows integer not null default 0,
  status text not null default 'processing',
  imported_by uuid references public.profiles(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists external_id text;
alter table public.leads add column if not exists import_batch_id uuid references public.import_batches(id) on update cascade on delete set null;
alter table public.leads add column if not exists system_source text;
alter table public.leads add column if not exists agent_id bigint;
alter table public.leads add column if not exists potential numeric(12,2);
alter table public.leads add column if not exists tasks_count integer;
alter table public.leads add column if not exists external_created_at timestamptz;
alter table public.leads add column if not exists external_updated_at timestamptz;

create unique index if not exists leads_external_id_unique
  on public.leads(external_id)
  where external_id is not null and btrim(external_id) <> '';

create index if not exists leads_import_batch_idx on public.leads(import_batch_id);
create index if not exists import_batches_created_idx on public.import_batches(created_at desc);

create or replace function public.prepare_imported_lead()
returns trigger
language plpgsql
as $$
begin
  if new.external_id is null or btrim(new.external_id) = '' then
    if new.phone is not null and btrim(new.phone) <> '' then
      new.external_id := 'phone:' || regexp_replace(new.phone, '[^0-9]', '', 'g');
    end if;
  end if;

  if tg_op = 'UPDATE'
     and new.import_batch_id is not null
     and new.import_batch_id is distinct from old.import_batch_id then
    new.owner_id := old.owner_id;
    new.assigned_by := old.assigned_by;
    new.assigned_at := old.assigned_at;
    new.status := old.status;
    new.customer_status := old.customer_status;
    new.registration_status := old.registration_status;
    new.payment_status := old.payment_status;
    new.registration_amount := old.registration_amount;
    new.discount_amount := old.discount_amount;
    new.final_amount := old.final_amount;
    new.discount_code := old.discount_code;
    new.paid_amount := old.paid_amount;
    new.next_follow_up_at := old.next_follow_up_at;
    new.last_contact_at := old.last_contact_at;
    new.last_call_at := old.last_call_at;
    new.last_note := old.last_note;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_prepare_import on public.leads;
create trigger leads_prepare_import
before insert or update on public.leads
for each row execute function public.prepare_imported_lead();

alter table public.import_batches enable row level security;

drop policy if exists import_batches_authenticated on public.import_batches;
create policy import_batches_authenticated
on public.import_batches
for all
to authenticated
using (true)
with check (true);
