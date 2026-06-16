-- EliteCRM V5.2 Lead Intake Roles
-- Run in Supabase SQL Editor after deploying this patch.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('developer','admin','manager','moderator','marketer','sales','finance'));

-- The following roles can add/import leads:
-- developer, admin, moderator, marketer
