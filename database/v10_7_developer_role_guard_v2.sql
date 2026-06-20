-- EliteCRM V10.7 Developer Role Guard
-- Run this file. Do not run the earlier developer-role guard draft.

create or replace function public.guard_developer_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.role = 'developer' then
    raise exception 'إنشاء مطور نظام جديد يتطلب إجراءً مباشرًا وآمنًا من قاعدة البيانات.';
  end if;

  if tg_op = 'UPDATE' then
    if old.role = 'developer' and new.role is distinct from old.role then
      raise exception 'لا يمكن تغيير صلاحية مطور النظام من واجهة التطبيق.';
    end if;
    if old.role <> 'developer' and new.role = 'developer' then
      raise exception 'لا يمكن ترقية مستخدم إلى مطور النظام من واجهة التطبيق.';
    end if;
    if old.role = 'developer' and new.is_active = false then
      raise exception 'لا يمكن إيقاف حساب مطور النظام من واجهة التطبيق.';
    end if;
  end if;

  if tg_op = 'DELETE' and old.role = 'developer' then
    raise exception 'لا يمكن حذف حساب مطور النظام من واجهة التطبيق.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_developer_write on public.profiles;
create trigger profiles_guard_developer_write
before insert or update or delete on public.profiles
for each row execute function public.guard_developer_role();
