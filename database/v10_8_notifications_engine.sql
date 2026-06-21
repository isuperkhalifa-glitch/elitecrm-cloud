-- EliteCRM V10.8 Role-aware Notification Engine
-- Run once in Supabase SQL Editor after the V10.6 and V10.7 migrations.

alter table public.notifications add column if not exists source_url text;
alter table public.notifications add column if not exists priority text not null default 'normal';
alter table public.notifications add column if not exists read_at timestamptz;
alter table public.notifications add column if not exists recipient_role text;
alter table public.notifications add column if not exists dedupe_key text;

alter table public.notifications drop constraint if exists notifications_priority_check;
alter table public.notifications add constraint notifications_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

create unique index if not exists notifications_user_dedupe_unique
  on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null and btrim(dedupe_key) <> '';

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, is_read, created_at desc);

create or replace function public.prepare_notification_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.recipient_role is null then
    select profile.role into new.recipient_role
    from public.profiles profile
    where profile.id = new.user_id;
  end if;

  if new.source_url is null or btrim(new.source_url) = '' then
    new.source_url := case
      when new.entity_type = 'leads' and new.entity_id is not null then '/customers/' || new.entity_id::text
      when new.entity_type = 'tasks' and new.type = 'calendar' then '/calendar'
      when new.entity_type = 'tasks' then '/requests?tab=incoming'
      when new.entity_type in ('registrations', 'invoices', 'payments') then '/registrations'
      when new.entity_type = 'commissions' then '/commissions'
      when new.entity_type = 'import_batches' then '/imports'
      when new.entity_type = 'profiles' then '/users'
      when new.entity_type = 'companies' then '/training-centers'
      when new.entity_type = 'courses' then '/courses'
      when new.entity_type = 'data_quality' then '/data-quality'
      when new.entity_type = 'reports' then '/reports'
      else null
    end;
  end if;

  if new.priority is null or new.priority not in ('low', 'normal', 'high', 'urgent') then
    new.priority := 'normal';
  end if;

  if new.type in ('follow_up', 'assignment') and new.priority = 'normal' then
    new.priority := 'high';
  end if;

  if new.is_read then
    new.read_at := coalesce(new.read_at, now());
  else
    new.read_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_prepare_metadata on public.notifications;
create trigger notifications_prepare_metadata
before insert or update of user_id, entity_type, entity_id, type, source_url, priority, is_read
on public.notifications
for each row execute function public.prepare_notification_metadata();

update public.notifications
set source_url = case
    when entity_type = 'leads' and entity_id is not null then '/customers/' || entity_id::text
    when entity_type = 'tasks' and type = 'calendar' then '/calendar'
    when entity_type = 'tasks' then '/requests?tab=incoming'
    when entity_type in ('registrations', 'invoices', 'payments') then '/registrations'
    when entity_type = 'commissions' then '/commissions'
    when entity_type = 'import_batches' then '/imports'
    when entity_type = 'profiles' then '/users'
    when entity_type = 'companies' then '/training-centers'
    when entity_type = 'courses' then '/courses'
    when entity_type = 'data_quality' then '/data-quality'
    when entity_type = 'reports' then '/reports'
    else source_url
  end,
  recipient_role = coalesce(
    recipient_role,
    (select profile.role from public.profiles profile where profile.id = notifications.user_id)
  ),
  read_at = case when is_read then coalesce(read_at, created_at, now()) else null end,
  priority = case
    when priority in ('low', 'normal', 'high', 'urgent') then priority
    when type in ('follow_up', 'assignment') then 'high'
    else 'normal'
  end;

create or replace function public.notify_active_roles(
  p_roles text[],
  p_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_title text,
  p_body text,
  p_source_url text,
  p_priority text,
  p_dedupe_key text,
  p_excluded_users uuid[] default array[]::uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  insert into public.notifications (
    user_id,
    type,
    entity_type,
    entity_id,
    action,
    title,
    body,
    source_url,
    priority,
    recipient_role,
    dedupe_key,
    is_read
  )
  select
    profile.id,
    p_type,
    p_entity_type,
    p_entity_id,
    p_action,
    p_title,
    p_body,
    p_source_url,
    case when p_priority in ('low', 'normal', 'high', 'urgent') then p_priority else 'normal' end,
    profile.role,
    p_dedupe_key,
    false
  from public.profiles profile
  where profile.is_active = true
    and profile.role = any(p_roles)
    and not (profile.id = any(coalesce(p_excluded_users, array[]::uuid[])))
  on conflict (user_id, dedupe_key)
    where dedupe_key is not null and btrim(dedupe_key) <> ''
  do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.notify_lead_role_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lead_name text := coalesce(new.full_name, new.customer_code, 'عميل');
  previous_status text;
  current_status text;
  exclusions uuid[] := array[]::uuid[];
begin
  if new.intake_by is not null then
    exclusions := array_append(exclusions, new.intake_by);
  end if;

  if tg_op = 'INSERT' then
    if new.lead_type = 'retargeted' and coalesce(new.pending_operation_dist, false) then
      perform public.notify_active_roles(
        array['developer','admin','manager','moderator'],
        'retargeting_queue',
        'leads',
        new.id,
        'pending_distribution',
        'عميل إعادة استهداف بانتظار التوزيع',
        'تم إنشاء سجل جديد للعميل ' || lead_name || ' ويحتاج إلى توزيع يدوي.',
        '/customers/' || new.id::text,
        'high',
        'lead-retargeting-' || new.id::text,
        exclusions
      );
    elsif new.entry_source = 'manual' and new.owner_id is null then
      perform public.notify_active_roles(
        array['developer','admin','manager','moderator'],
        'manual_lead',
        'leads',
        new.id,
        'created_unassigned',
        'عميل يدوي جديد بانتظار التوزيع',
        'تم تسجيل العميل ' || lead_name || ' بدون مسؤول مبيعات.',
        '/customers/' || new.id::text,
        'normal',
        'lead-manual-unassigned-' || new.id::text,
        exclusions
      );
    end if;

    if nullif(btrim(coalesce(new.campaign_name, '')), '') is not null then
      perform public.notify_active_roles(
        array['marketer'],
        'campaign_lead',
        'leads',
        new.id,
        'created',
        'عميل جديد من حملة تسويقية',
        'وصل العميل ' || lead_name || ' من الحملة: ' || new.campaign_name,
        '/customers/' || new.id::text,
        'normal',
        'campaign-lead-' || new.id::text,
        exclusions
      );
    end if;

    return new;
  end if;

  previous_status := coalesce(old.customer_status, old.status, '');
  current_status := coalesce(new.customer_status, new.status, '');

  if current_status is distinct from previous_status and current_status = 'paid' then
    perform public.notify_active_roles(
      array['developer','admin','manager','finance'],
      'payment',
      'leads',
      new.id,
      'paid',
      'تم تسجيل سداد عميل',
      'تم تحديث العميل ' || lead_name || ' إلى حالة سدد.',
      '/customers/' || new.id::text,
      'high',
      'lead-paid-' || new.id::text || '-' || extract(epoch from now())::bigint::text,
      exclusions
    );
  elsif current_status is distinct from previous_status and current_status = 'wrong_number' then
    perform public.notify_active_roles(
      array['developer','admin','manager','moderator','data_analyst'],
      'data_quality',
      'leads',
      new.id,
      'wrong_number',
      'رقم عميل غير صحيح',
      'تم تصنيف رقم العميل ' || lead_name || ' كرقم خطأ ويحتاج مراجعة جودة البيانات.',
      '/customers/' || new.id::text,
      'high',
      'lead-wrong-number-' || new.id::text,
      exclusions
    );
  end if;

  return new;
end;
$$;

drop trigger if exists leads_notify_roles on public.leads;
create trigger leads_notify_roles
after insert or update of status, customer_status
on public.leads
for each row execute function public.notify_lead_role_events();

create or replace function public.notify_urgent_request_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  excluded uuid[] := array[]::uuid[];
begin
  if new.request_code is null or new.priority <> 'urgent' then
    return new;
  end if;

  if new.sender_id is not null then excluded := array_append(excluded, new.sender_id); end if;
  if new.receiver_id is not null then excluded := array_append(excluded, new.receiver_id); end if;

  perform public.notify_active_roles(
    array['developer','admin','manager'],
    'urgent_request',
    'tasks',
    new.id,
    'created',
    'طلب داخلي عاجل',
    coalesce(new.title, 'طلب عاجل') || ' — يحتاج متابعة إدارية.',
    '/requests?tab=team',
    'urgent',
    'urgent-request-' || new.id::text,
    excluded
  );

  return new;
end;
$$;

drop trigger if exists tasks_notify_urgent_roles on public.tasks;
create trigger tasks_notify_urgent_roles
after insert on public.tasks
for each row execute function public.notify_urgent_request_roles();

create or replace function public.notify_import_batch_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status in ('completed', 'success', 'done') then
    perform public.notify_active_roles(
      array['developer','admin','moderator','marketer','data_analyst'],
      'import',
      'import_batches',
      new.id,
      'completed',
      'اكتمل استيراد البيانات',
      coalesce(new.file_name, 'ملف البيانات') || ': تم استيراد ' || coalesce(new.imported_rows, 0)::text || ' صف وفشل ' || coalesce(new.failed_rows, 0)::text || ' صف.',
      '/imports',
      case when coalesce(new.failed_rows, 0) > 0 then 'high' else 'normal' end,
      'import-completed-' || new.id::text,
      array_remove(array[new.imported_by], null)
    );
  elsif new.status in ('failed', 'error') then
    perform public.notify_active_roles(
      array['developer','admin','moderator','marketer','data_analyst'],
      'import',
      'import_batches',
      new.id,
      'failed',
      'فشل استيراد البيانات',
      'تعذر إكمال استيراد الملف: ' || coalesce(new.file_name, 'ملف غير محدد'),
      '/imports',
      'urgent',
      'import-failed-' || new.id::text,
      array[]::uuid[]
    );
  end if;

  return new;
end;
$$;

drop trigger if exists import_batches_notify_roles on public.import_batches;
create trigger import_batches_notify_roles
after update of status on public.import_batches
for each row execute function public.notify_import_batch_roles();

create or replace function public.notify_commission_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.sales_id is not null and new.status = 'due' then
    insert into public.notifications (
      user_id, type, entity_type, entity_id, action, title, body,
      source_url, priority, dedupe_key, is_read
    ) values (
      new.sales_id,
      'commission',
      'commissions',
      new.id,
      'created',
      'عمولة جديدة مستحقة',
      'تم احتساب عمولة بقيمة ' || coalesce(new.commission_amount, 0)::text || '.',
      '/commissions',
      'high',
      'commission-due-' || new.id::text,
      false
    )
    on conflict (user_id, dedupe_key)
      where dedupe_key is not null and btrim(dedupe_key) <> ''
    do nothing;

    perform public.notify_active_roles(
      array['developer','admin','finance'],
      'commission',
      'commissions',
      new.id,
      'review_due',
      'عمولة جديدة تحتاج مراجعة',
      'تم إنشاء عمولة جديدة بقيمة ' || coalesce(new.commission_amount, 0)::text || '.',
      '/commissions',
      'normal',
      'commission-review-' || new.id::text,
      array_remove(array[new.sales_id], null)
    );
  elsif tg_op = 'UPDATE'
    and new.status is distinct from old.status
    and new.status = 'paid'
    and new.sales_id is not null then
    insert into public.notifications (
      user_id, type, entity_type, entity_id, action, title, body,
      source_url, priority, dedupe_key, is_read
    ) values (
      new.sales_id,
      'commission',
      'commissions',
      new.id,
      'paid',
      'تم صرف العمولة',
      'تم اعتماد وصرف عمولتك بقيمة ' || coalesce(new.commission_amount, 0)::text || '.',
      '/commissions',
      'high',
      'commission-paid-' || new.id::text,
      false
    )
    on conflict (user_id, dedupe_key)
      where dedupe_key is not null and btrim(dedupe_key) <> ''
    do nothing;
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.commissions') is not null then
    execute 'drop trigger if exists commissions_notify_events on public.commissions';
    execute 'create trigger commissions_notify_events after insert or update of status on public.commissions for each row execute function public.notify_commission_events()';
  end if;
end $$;

grant execute on function public.notify_active_roles(
  text[], text, text, uuid, text, text, text, text, text, text, uuid[]
) to authenticated;
