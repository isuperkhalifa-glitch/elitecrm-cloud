-- EliteCRM V5.0 Core Restructure
-- Company = Training Center
-- Center -> Courses -> Customers -> Registrations

alter table public.companies add column if not exists center_type text default 'training_center';
alter table public.companies add column if not exists contract_status text default 'active';
alter table public.companies add column if not exists notes text;

alter table public.courses add column if not exists company_id uuid references public.companies(id) on update cascade on delete set null;
alter table public.courses add column if not exists code text;
alter table public.courses add column if not exists accreditation_number text;
alter table public.courses add column if not exists delivery_mode text default 'online';
alter table public.courses add column if not exists duration_days integer;
alter table public.courses add column if not exists duration_hours integer;
alter table public.courses add column if not exists price numeric(12,2) default 0;
alter table public.courses add column if not exists sale_price numeric(12,2);
alter table public.courses add column if not exists discount_type text default 'none';
alter table public.courses add column if not exists discount_value numeric(12,2) default 0;
alter table public.courses add column if not exists discount_code text;
alter table public.courses add column if not exists location text;
alter table public.courses add column if not exists notes text;
alter table public.courses add column if not exists status text default 'active';
alter table public.courses add column if not exists updated_at timestamptz default now();

alter table public.leads add column if not exists company_id uuid references public.companies(id) on update cascade on delete set null;
alter table public.leads add column if not exists registration_amount numeric(12,2) default 0;
alter table public.leads add column if not exists discount_amount numeric(12,2) default 0;
alter table public.leads add column if not exists final_amount numeric(12,2) default 0;
alter table public.leads add column if not exists discount_code text;
alter table public.leads add column if not exists paid_amount numeric(12,2) default 0;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on update cascade on delete cascade,
  company_id uuid references public.companies(id) on update cascade on delete set null,
  course_id text references public.courses(id) on update cascade on delete set null,
  sales_id uuid references public.profiles(id) on update cascade on delete set null,
  status text not null default 'registered',
  payment_status text not null default 'unpaid',
  list_price numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  final_price numeric(12,2) not null default 0,
  discount_code text,
  paid_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.registrations add column if not exists lead_id uuid references public.leads(id) on update cascade on delete cascade;
alter table public.registrations add column if not exists company_id uuid references public.companies(id) on update cascade on delete set null;
alter table public.registrations add column if not exists course_id text references public.courses(id) on update cascade on delete set null;
alter table public.registrations add column if not exists sales_id uuid references public.profiles(id) on update cascade on delete set null;
alter table public.registrations add column if not exists status text not null default 'registered';
alter table public.registrations add column if not exists payment_status text not null default 'unpaid';
alter table public.registrations add column if not exists list_price numeric(12,2) not null default 0;
alter table public.registrations add column if not exists discount_amount numeric(12,2) not null default 0;
alter table public.registrations add column if not exists final_price numeric(12,2) not null default 0;
alter table public.registrations add column if not exists discount_code text;
alter table public.registrations add column if not exists paid_amount numeric(12,2) not null default 0;
alter table public.registrations add column if not exists notes text;
alter table public.registrations add column if not exists created_at timestamptz not null default now();
alter table public.registrations add column if not exists updated_at timestamptz not null default now();

create index if not exists courses_company_id_idx on public.courses(company_id);
create index if not exists courses_status_idx on public.courses(status);
create index if not exists registrations_lead_id_idx on public.registrations(lead_id);
create index if not exists registrations_company_id_idx on public.registrations(company_id);
create index if not exists registrations_course_id_idx on public.registrations(course_id);
create index if not exists registrations_sales_id_idx on public.registrations(sales_id);
create index if not exists registrations_payment_status_idx on public.registrations(payment_status);

alter table public.courses enable row level security;
alter table public.registrations enable row level security;

drop policy if exists courses_all_authenticated on public.courses;
create policy courses_all_authenticated on public.courses for all to authenticated using (true) with check (true);

drop policy if exists registrations_all_authenticated on public.registrations;
create policy registrations_all_authenticated on public.registrations for all to authenticated using (true) with check (true);
