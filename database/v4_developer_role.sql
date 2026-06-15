-- EliteCRM V4 Developer Role
-- Run this in Supabase SQL Editor only if saving role=developer fails.

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('developer','admin','manager','moderator','sales','finance'));
