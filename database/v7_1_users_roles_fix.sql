-- EliteCRM V7.1 Users Roles Fix
-- Run this file in Supabase SQL Editor after deploying this patch.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('developer','admin','manager','moderator','marketer','sales','finance','data_analyst'));

update public.profiles
set role = 'data_analyst'
where role in ('analyst','data analyst','data-analyst','ظ…ط­ظ„ظ„ ط¨ظٹط§ظ†ط§طھ');
