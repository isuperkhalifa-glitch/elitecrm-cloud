"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Circle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";

type NotificationItem = {
  id: string;
  user_id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  title: string | null;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

const arEntities: Record<string, string> = {
  companies: "شركة",
  contacts: "جهة اتصال",
  leads: "عميل محتمل",
  deals: "صفقة",
  tasks: "مهمة",
  invoices: "فاتورة",
  commissions: "عمولة",
};

const enEntities: Record<string, string> = {
  companies: "Company",
  contacts: "Contact",
  leads: "Lead",
  deals: "Deal",
  tasks: "Task",
  invoices: "Invoice",
  commissions: "Commission",
};

export function NotificationBell() {
  const { language } = useI18n();
  const isArabic = language === "ar";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setUserId(null);
        setNotifications([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("notifications")
        .select("id,user_id,type,entity_type,entity_id,action,title,body,is_read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!mounted) return;

      setNotifications((data ?? []) as NotificationItem[]);
      setLoading(false);
    }

    load();

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
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((current) => [
            payload.new as NotificationItem,
            ...current,
          ].slice(0, 12));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  function entityLabel(entityType: string | null) {
    if (!entityType) return isArabic ? "عنصر" : "Item";

    const map = isArabic ? arEntities : enEntities;

    return map[entityType] ?? entityType;
  }

  function actionLabel(action: string | null) {
    if (isArabic) {
      if (action === "created") return "تم إنشاء";
      if (action === "updated") return "تم تحديث";
      return "تحديث";
    }

    if (action === "created") return "created";
    if (action === "updated") return "updated";
    return "updated";
  }

  function notificationTitle(item: NotificationItem) {
    const entity = entityLabel(item.entity_type);
    const action = actionLabel(item.action);

    if (isArabic) return `${action} ${entity}`;

    return `${entity} ${action}`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString(isArabic ? "ar-EG" : "en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  async function markAllRead() {
    if (!userId) return;

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true }))
    );

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="elite-action-button relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
        type="button"
        aria-label={isArabic ? "الإشعارات" : "Notifications"}
        title={isArabic ? "الإشعارات" : "Notifications"}
      >
        <Bell className="h-4 w-4" />

        {unreadCount > 0 ? (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-black text-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="elite-notification-panel absolute end-0 top-12 z-[120] w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
            <div>
              <p className="text-sm font-bold text-white">
                {isArabic ? "الإشعارات" : "Notifications"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isArabic
                  ? `${unreadCount} غير مقروءة`
                  : `${unreadCount} unread`}
              </p>
            </div>

            <button
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
              type="button"
            >
              <CheckCheck className="h-4 w-4" />
              <span>{isArabic ? "قراءة الكل" : "Read all"}</span>
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isArabic ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                {isArabic ? "لا توجد إشعارات حتى الآن." : "No notifications yet."}
              </div>
            ) : (
              notifications.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-2xl p-3 transition hover:bg-white/10 ${
                    item.is_read ? "opacity-70" : "bg-emerald-400/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Circle
                      className={`mt-1 h-2.5 w-2.5 shrink-0 ${
                        item.is_read ? "text-slate-500" : "fill-emerald-400 text-emerald-400"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        {notificationTitle(item)}
                      </p>

                      {item.title ? (
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {item.title}
                        </p>
                      ) : null}

                      <p className="mt-2 text-[11px] text-slate-500" dir="ltr">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
