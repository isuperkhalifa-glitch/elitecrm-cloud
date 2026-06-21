"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, CheckCheck, Circle, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import {
  NotificationDetailBubble,
  type NotificationDetailItem,
} from "@/components/notification-detail-bubble";

type NotificationItem = NotificationDetailItem & {
  user_id: string;
  action: string | null;
  read_at?: string | null;
  recipient_role?: string | null;
};

const basicFields = "id,user_id,type,entity_type,entity_id,action,title,body,is_read,created_at";
const fullFields = `${basicFields},source_url,priority,read_at,recipient_role`;

const arEntities: Record<string, string> = {
  companies: "مركز تدريب",
  contacts: "جهة اتصال",
  leads: "عميل",
  deals: "صفقة",
  tasks: "طلب أو مهمة",
  invoices: "فاتورة",
  payments: "دفعة",
  registrations: "تسجيل",
  commissions: "عمولة",
  import_batches: "عملية استيراد",
  profiles: "مستخدم",
  courses: "دورة",
  data_quality: "جودة البيانات",
  reports: "تقرير",
};

const enEntities: Record<string, string> = {
  companies: "Training center",
  contacts: "Contact",
  leads: "Customer",
  deals: "Deal",
  tasks: "Request or task",
  invoices: "Invoice",
  payments: "Payment",
  registrations: "Registration",
  commissions: "Commission",
  import_batches: "Import batch",
  profiles: "User",
  courses: "Course",
  data_quality: "Data quality",
  reports: "Report",
};

const arTypes: Record<string, string> = {
  assignment: "إسناد",
  follow_up: "متابعة",
  internal_request: "طلب داخلي",
  urgent_request: "طلب عاجل",
  calendar: "تقويم",
  payment: "سداد",
  commission: "عمولة",
  import: "استيراد",
  data_quality: "جودة بيانات",
  manual_lead: "إدخال يدوي",
  campaign_lead: "حملة تسويقية",
  retargeting_queue: "إعادة استهداف",
  system: "النظام",
};

const enTypes: Record<string, string> = {
  assignment: "Assignment",
  follow_up: "Follow-up",
  internal_request: "Internal request",
  urgent_request: "Urgent request",
  calendar: "Calendar",
  payment: "Payment",
  commission: "Commission",
  import: "Import",
  data_quality: "Data quality",
  manual_lead: "Manual entry",
  campaign_lead: "Campaign lead",
  retargeting_queue: "Retargeting",
  system: "System",
};

function sourcePath(item: NotificationItem) {
  const saved = String(item.source_url ?? "").trim();
  if (saved.startsWith("/") && !saved.startsWith("//")) return saved;
  if (item.entity_type === "leads" && item.entity_id) return `/customers/${item.entity_id}`;
  if (item.entity_type === "tasks" && item.type === "calendar") return "/calendar";
  if (item.entity_type === "tasks") return "/requests?tab=incoming";
  if (["registrations", "invoices", "payments"].includes(item.entity_type ?? "")) return "/registrations";
  if (item.entity_type === "commissions") return "/commissions";
  if (item.entity_type === "import_batches") return "/imports";
  if (item.entity_type === "profiles") return "/users";
  if (item.entity_type === "companies") return "/training-centers";
  if (item.entity_type === "courses") return "/courses";
  if (item.entity_type === "data_quality") return "/data-quality";
  if (item.entity_type === "reports") return "/reports";
  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const { language } = useI18n();
  const isArabic = language === "ar";
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [openingSource, setOpeningSource] = useState(false);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!mounted) return;

      const id = authData.user?.id ?? null;
      setUserId(id);
      if (!id) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      let result = await supabase
        .from("notifications")
        .select(fullFields)
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (result.error) {
        result = await supabase
          .from("notifications")
          .select(basicFields)
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(30);
      }

      if (!mounted) return;
      setNotifications((result.data ?? []) as NotificationItem[]);
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const item = payload.new as NotificationItem;
          setNotifications((current) => [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 30));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const item = payload.new as NotificationItem;
          setNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...item } : entry)));
          setSelected((current) => (current?.id === item.id ? { ...current, ...item } : current));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (!open) return;

    const outside = (event: MouseEvent) => {
      if (!selected && panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selected) setSelected(null);
      else setOpen(false);
    };

    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, selected]);

  function entityLabel(item: NotificationItem) {
    if (!item.entity_type) return isArabic ? "عنصر" : "Item";
    return (isArabic ? arEntities : enEntities)[item.entity_type] ?? item.entity_type;
  }

  function typeLabel(item: NotificationItem) {
    return (isArabic ? arTypes : enTypes)[item.type] ?? item.type;
  }

  function titleFor(item: NotificationItem) {
    if (item.title?.trim()) return item.title;
    const entity = entityLabel(item);
    const action = item.action === "assigned"
      ? isArabic ? "تم الإسناد" : "Assigned"
      : item.action === "created"
        ? isArabic ? "تم الإنشاء" : "Created"
        : isArabic ? "تحديث جديد" : "New update";
    return isArabic ? `${action} — ${entity}` : `${entity} — ${action}`;
  }

  function formattedDate(item: NotificationItem) {
    return new Date(item.created_at).toLocaleString(isArabic ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function priorityLabel(item: NotificationItem) {
    if (item.priority === "urgent") return isArabic ? "عاجل" : "Urgent";
    if (item.priority === "high") return isArabic ? "مهم" : "High";
    if (item.priority === "low") return isArabic ? "منخفض" : "Low";
    return isArabic ? "عادي" : "Normal";
  }

  function priorityClass(item: NotificationItem) {
    if (item.priority === "urgent") return "border-red-200 bg-red-50 text-red-700";
    if (item.priority === "high") return "border-amber-200 bg-amber-50 text-amber-700";
    if (item.priority === "low") return "border-slate-200 bg-slate-50 text-slate-600";
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  async function markRead(item: NotificationItem) {
    if (item.is_read) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, is_read: true, read_at: readAt } : entry)));
    setSelected((current) => (current?.id === item.id ? { ...current, is_read: true, read_at: readAt } : current));

    const enhanced = await supabase.from("notifications").update({ is_read: true, read_at: readAt }).eq("id", item.id).eq("user_id", item.user_id);
    if (enhanced.error) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", item.id).eq("user_id", item.user_id);
    }
  }

  async function markAllRead() {
    if (!userId || unreadCount === 0) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? readAt })));

    const enhanced = await supabase.from("notifications").update({ is_read: true, read_at: readAt }).eq("user_id", userId).eq("is_read", false);
    if (enhanced.error) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    }
  }

  async function openDetails(item: NotificationItem) {
    setSelected(item);
    await markRead(item);
  }

  async function openSource(item: NotificationItem) {
    const path = sourcePath(item);
    if (!path) return;
    setOpeningSource(true);
    await markRead(item);
    setSelected(null);
    setOpen(false);
    router.push(path);
    setOpeningSource(false);
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="elite-header-icon relative inline-flex"
        type="button"
        aria-label={isArabic ? "الإشعارات" : "Notifications"}
      >
        {unreadCount > 0 ? <BellRing className="h-4 w-4 text-emerald-600" /> : <Bell className="h-4 w-4" />}
        {unreadCount > 0 ? (
          <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-12 z-[120] w-[min(94vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 p-4">
            <div>
              <p className="text-sm font-black text-slate-800">{isArabic ? "مركز الإشعارات" : "Notification center"}</p>
              <p className="mt-1 text-xs text-slate-500">{isArabic ? `${unreadCount} غير مقروء` : `${unreadCount} unread`}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => void markAllRead()}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
                type="button"
              >
                <CheckCheck className="h-4 w-4" />
                {isArabic ? "قراءة الكل" : "Read all"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isArabic ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                {isArabic ? "لا توجد إشعارات مرتبطة بصلاحيتك." : "No role-related notifications yet."}
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openDetails(item)}
                  className={`mb-1 w-full rounded-2xl border p-3 text-start transition last:mb-0 ${item.is_read ? "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50" : "border-emerald-200 bg-emerald-50/70"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.is_read ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
                      {item.is_read ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-black text-slate-800">{titleFor(item)}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityClass(item)}`}>{priorityLabel(item)}</span>
                      </div>
                      {item.body ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.body}</p> : null}
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>{typeLabel(item)}</span>
                        <span dir="ltr">{formattedDate(item)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {selected ? (
        <NotificationDetailBubble
          item={selected}
          isArabic={isArabic}
          openingSource={openingSource}
          title={titleFor(selected)}
          typeLabel={typeLabel(selected)}
          entityLabel={entityLabel(selected)}
          priorityLabel={priorityLabel(selected)}
          formattedDate={formattedDate(selected)}
          hasSource={Boolean(sourcePath(selected))}
          onClose={() => setSelected(null)}
          onOpenSource={() => void openSource(selected)}
        />
      ) : null}
    </div>
  );
}
