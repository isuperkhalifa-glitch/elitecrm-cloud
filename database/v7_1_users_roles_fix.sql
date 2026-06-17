-- EliteCRM V7.1 Users Roles Fix
-- Run this file in Supabase SQL Editor after deploying this patch.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'developer',
    'admin',
    'manager',
    'moderator',
    'marketer',
    'sales',
    'finance',
    'data_analyst'
  ));

update public.profiles
set role = 'data_analyst'
where role in (
  'analyst',
  'data analyst',
  'data-analyst',
  'محلل بيانات',
  'محلل_بيانات',
  'ظ…ط­ظ„ظ„ ط¨ظٹط§ظ†ط§طھ'
);

update public.profiles
set role = 'sales'
where role is null or role not in (
  'developer',
  'admin',
  'manager',
  'moderator',
  'marketer',
  'sales',
  'finance',
  'data_analyst'
);

alter table public.profiles
  alter column is_active set default true;

update public.profiles
set is_active = true
where is_active is null;
