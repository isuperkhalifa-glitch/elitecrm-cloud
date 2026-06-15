-- EliteCRM V4.4 Registration Company Selection
-- Run in Supabase SQL Editor after V4.3.

alter table public.leads add column if not exists company_id text;
alter table public.leads add column if not exists course_id text;
alter table public.leads add column if not exists course_price numeric(12,2);
alter table public.leads add column if not exists discount_code text;
alter table public.leads add column if not exists discount_value numeric(12,2) not null default 0;
alter table public.leads add column if not exists final_price numeric(12,2);
alter table public.leads add column if not exists registration_notes text;

create index if not exists leads_company_id_idx on public.leads(company_id);
create index if not exists leads_course_id_idx on public.leads(course_id);
create index if not exists leads_registration_company_idx on public.leads(company_name);
