-- EliteCRM V10.4 Registration Integrity
-- Run once in Supabase SQL Editor.

create or replace function public.validate_registration_values()
returns trigger
language plpgsql
as $$
begin
  new.list_price := greatest(coalesce(new.list_price, 0), 0);
  new.discount_amount := least(greatest(coalesce(new.discount_amount, 0), 0), new.list_price);
  new.final_price := greatest(new.list_price - new.discount_amount, 0);
  new.paid_amount := least(greatest(coalesce(new.paid_amount, 0), 0), new.final_price);

  if coalesce(new.status, '') <> 'canceled' and exists (
    select 1 from public.registrations existing
    where existing.lead_id = new.lead_id
      and existing.course_id = new.course_id
      and coalesce(existing.status, '') <> 'canceled'
      and existing.id <> coalesce(new.id, gen_random_uuid())
  ) then
    raise exception 'يوجد تسجيل نشط لنفس العميل في نفس الدورة.';
  end if;

  if coalesce(new.payment_status, '') <> 'refunded' then
    if new.final_price > 0 and new.paid_amount >= new.final_price then
      new.payment_status := 'paid';
    elsif new.paid_amount > 0 then
      new.payment_status := 'partial';
    else
      new.payment_status := 'unpaid';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists registrations_validate_values on public.registrations;
create trigger registrations_validate_values
before insert or update on public.registrations
for each row execute function public.validate_registration_values();

create or replace function public.sync_lead_from_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.registrations%rowtype;
  target_lead_id uuid;
begin
  if tg_op = 'DELETE' then
    target_lead_id := old.lead_id;
  else
    target_lead_id := new.lead_id;
  end if;

  select registration.* into target
  from public.registrations registration
  where registration.lead_id = target_lead_id
    and coalesce(registration.status, '') <> 'canceled'
  order by registration.updated_at desc nulls last, registration.created_at desc
  limit 1;

  if target.id is null then
    update public.leads
    set registration_status = 'not_registered', payment_status = 'unpaid',
        registration_amount = 0, discount_amount = 0, final_amount = 0,
        paid_amount = 0, discount_code = null
    where id = target_lead_id;
  else
    update public.leads
    set company_id = target.company_id, course_id = target.course_id,
        registration_status = target.status, payment_status = target.payment_status,
        registration_amount = target.list_price, discount_amount = target.discount_amount,
        final_amount = target.final_price, discount_code = target.discount_code,
        paid_amount = target.paid_amount,
        status = case when target.payment_status = 'paid' then 'paid'
          when coalesce(status, '') = 'paid' then 'interested' else status end,
        customer_status = case when target.payment_status = 'paid' then 'paid'
          when coalesce(customer_status, '') = 'paid' then 'interested' else customer_status end,
        last_contact_at = now()
    where id = target_lead_id;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists registrations_sync_lead on public.registrations;
create trigger registrations_sync_lead
after insert or update or delete on public.registrations
for each row execute function public.sync_lead_from_registration();

create index if not exists registrations_active_lookup_idx
  on public.registrations(lead_id, course_id, status);
