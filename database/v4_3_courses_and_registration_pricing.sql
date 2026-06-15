-- EliteCRM V4.3 Courses Module + Registration Pricing
-- Run this in Supabase SQL Editor before using /courses and registration pricing.

create table if not exists public.courses (
  id text primary key,
  name text not null,
  name_ar text,
  name_en text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.courses add column if not exists code text;
alter table public.courses add column if not exists category text;
alter table public.courses add column if not exists delivery_mode text not null default 'online';
alter table public.courses add column if not exists duration_days integer;
alter table public.courses add column if not exists duration_hours integer;
alter table public.courses add column if not exists accreditation_number text;
alter table public.courses add column if not exists provider text;
alter table public.courses add column if not exists base_price numeric(12,2) not null default 0;
alter table public.courses add column if not exists sale_price numeric(12,2);
alter table public.courses add column if not exists discount_type text not null default 'none';
alter table public.courses add column if not exists discount_value numeric(12,2) not null default 0;
alter table public.courses add column if not exists discount_code text;
alter table public.courses add column if not exists currency text not null default 'SAR';
alter table public.courses add column if not exists start_date date;
alter table public.courses add column if not exists end_date date;
alter table public.courses add column if not exists location text;
alter table public.courses add column if not exists description text;
alter table public.courses add column if not exists notes text;
alter table public.courses add column if not exists updated_at timestamptz;

update public.courses set code = id where code is null;
create unique index if not exists courses_code_unique_idx on public.courses(code) where code is not null;
create index if not exists courses_active_sort_idx on public.courses(is_active, sort_order);

alter table public.leads add column if not exists course_id text;
alter table public.leads add column if not exists course_price numeric(12,2);
alter table public.leads add column if not exists discount_code text;
alter table public.leads add column if not exists discount_value numeric(12,2) not null default 0;
alter table public.leads add column if not exists final_price numeric(12,2);
alter table public.leads add column if not exists registration_notes text;

create index if not exists leads_course_id_idx on public.leads(course_id);
create index if not exists leads_final_price_idx on public.leads(final_price);

insert into public.courses (id, code, name, name_ar, name_en, category, delivery_mode, duration_days, duration_hours, currency, base_price, sale_price, discount_type, discount_value, discount_code, is_active, sort_order)
values
  ('pmp', 'PMP', 'PMP', 'دورة PMP', 'PMP', 'Project Management', 'online', 5, 35, 'SAR', 2700, 1499, 'fixed', 1201, null, true, 10),
  ('grcp', 'GRCP', 'GRCP', 'دورة GRCP', 'GRCP', 'Governance', 'online', 5, 30, 'SAR', 1999, 1099, 'fixed', 900, null, true, 20),
  ('excel', 'EXCEL', 'Excel', 'دورة Excel', 'Excel', 'Data', 'online', 5, 25, 'SAR', 1400, 899, 'fixed', 501, null, true, 30),
  ('english-club', 'ENGLISH', 'English Club', 'نادي اللغة الإنجليزية', 'English Club', 'Languages', 'online', 5, 25, 'SAR', 1500, 999, 'fixed', 501, null, true, 40)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  category = excluded.category,
  delivery_mode = excluded.delivery_mode,
  duration_days = excluded.duration_days,
  duration_hours = excluded.duration_hours,
  currency = excluded.currency,
  base_price = excluded.base_price,
  sale_price = excluded.sale_price,
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  discount_code = excluded.discount_code,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();
