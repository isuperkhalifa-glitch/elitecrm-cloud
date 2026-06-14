-- EliteCRM V3.0 Customer Core Update
-- Run this file in Supabase SQL Editor before testing the new customer fields.

create table if not exists public.courses (
  id text primary key,
  name text not null,
  name_ar text,
  name_en text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.courses (id, name, name_ar, name_en, sort_order)
values
  ('pmp', 'PMP', 'PMP', 'PMP', 10),
  ('grcp', 'GRCP', 'GRCP', 'GRCP', 20),
  ('power-bi-offline', 'Power BI Offline', 'Power BI Offline', 'Power BI Offline', 30),
  ('kpi', 'KPI', 'KPI', 'KPI', 40),
  ('pmp-offline', 'PMP Offline', 'PMP Offline', 'PMP Offline', 50),
  ('rmp', 'RMP', 'RMP', 'RMP', 60),
  ('ai', 'AI', 'AI', 'AI', 70),
  ('aphri', 'aPHRi (HRCI)', 'aPHRi (HRCI)', 'aPHRi (HRCI)', 80),
  ('social-media', 'Social Media', 'Social Media', 'Social Media', 90),
  ('financial-management', 'Financial Management', 'الإدارة المالية', 'Financial Management', 100),
  ('ai-offline', 'AI Offline', 'AI Offline', 'AI Offline', 110),
  ('excel', 'Excel', 'Excel', 'Excel', 120),
  ('power-bi', 'Power BI', 'Power BI', 'Power BI', 130),
  ('cs', 'CS', 'CS', 'CS', 140),
  ('capm', 'CAPM', 'CAPM', 'CAPM', 150),
  ('english-club', 'English Club', 'English Club', 'English Club', 160)
on conflict (id) do update set
  name = excluded.name,
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  is_active = true;

alter table public.leads add column if not exists lead_type text not null default 'fresh';
alter table public.leads add column if not exists country_code text not null default '+966';
alter table public.leads add column if not exists phone_number text;
alter table public.leads add column if not exists course_id text;
alter table public.leads add column if not exists next_call_at timestamptz;
alter table public.leads add column if not exists status_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_lead_type_check'
  ) then
    alter table public.leads
      add constraint leads_lead_type_check
      check (lead_type in ('fresh', 'retargeted', 'redirected'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'leads_status_v3_check'
  ) then
    alter table public.leads
      add constraint leads_status_v3_check
      check (status in ('interested', 'not_interested', 'need_offer', 'missed', 'wrong_number', 'paid', 'busy'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'leads_course_id_fkey'
  ) then
    alter table public.leads
      add constraint leads_course_id_fkey
      foreign key (course_id) references public.courses(id)
      on update cascade on delete set null;
  end if;
end $$;

update public.leads
set status = case
  when status in ('interested', 'not_interested', 'need_offer', 'missed', 'wrong_number', 'paid', 'busy') then status
  when status in ('new', 'assigned', 'contacted', 'qualified', 'registered') then 'interested'
  when status in ('converted') then 'paid'
  when status in ('lost', 'canceled') then 'not_interested'
  when status in ('no_answer', 'no_reply') then 'missed'
  when status in ('follow_up') then 'busy'
  else 'interested'
end,
customer_status = case
  when status in ('interested', 'not_interested', 'need_offer', 'missed', 'wrong_number', 'paid', 'busy') then status
  when status in ('new', 'assigned', 'contacted', 'qualified', 'registered') then 'interested'
  when status in ('converted') then 'paid'
  when status in ('lost', 'canceled') then 'not_interested'
  when status in ('no_answer', 'no_reply') then 'missed'
  when status in ('follow_up') then 'busy'
  else 'interested'
end,
status_updated_at = coalesce(status_updated_at, now())
where status is null
   or status not in ('interested', 'not_interested', 'need_offer', 'missed', 'wrong_number', 'paid', 'busy')
   or customer_status is null
   or customer_status not in ('interested', 'not_interested', 'need_offer', 'missed', 'wrong_number', 'paid', 'busy');

update public.leads
set country_code = case
    when phone like '966%' then '+966'
    when phone like '20%' then '+20'
    when phone like '967%' then '+967'
    when phone like '91%' then '+91'
    when phone like '971%' then '+971'
    else coalesce(country_code, '+966')
  end,
  phone_number = case
    when phone like '966%' then regexp_replace(substr(phone, 4), '^0+', '')
    when phone like '20%' then regexp_replace(substr(phone, 3), '^0+', '')
    when phone like '967%' then regexp_replace(substr(phone, 4), '^0+', '')
    when phone like '91%' then regexp_replace(substr(phone, 3), '^0+', '')
    when phone like '971%' then regexp_replace(substr(phone, 4), '^0+', '')
    else regexp_replace(coalesce(phone, ''), '^0+', '')
  end
where phone_number is null and phone is not null;

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_customer_status_idx on public.leads(customer_status);
create index if not exists leads_lead_type_idx on public.leads(lead_type);
create index if not exists leads_course_id_idx on public.leads(course_id);
create index if not exists leads_next_call_at_idx on public.leads(next_call_at);