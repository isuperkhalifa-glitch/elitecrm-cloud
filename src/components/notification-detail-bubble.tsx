"use client";

import { ArrowUpLeft, BellRing, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";

export type NotificationDetailItem = {
  id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string | null;
  body: string | null;
  is_read: boolean;
  created_at: string;
  source_url?: string | null;
  priority?: "low" | "normal" | "high" | "urgent" | null;
};

type Props = {
  item: NotificationDetailItem;
  isArabic: boolean;
  openingSource: boolean;
  title: string;
  typeLabel: string;
  entityLabel: string;
  priorityLabel: string;
  formattedDate: string;
  hasSource: boolean;
  onClose: () => void;
  onOpenSource: () => void;
};

export function NotificationDetailBubble({
  item,
  isArabic,
  openingSource,
  title,
  typeLabel,
  entityLabel,
  priorityLabel,
  formattedDate,
  hasSource,
  onClose,
  onOpenSource,
}: Props) {
  return (
    <div className="fixed inset-0 z-[180] bg-slate-950/20 backdrop-blur-[2px]" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={isArabic ? "تفاصيل الإشعار" : "Notification details"}
        onMouseDown={(event) => event.stopPropagation()}
        className={`absolute top-[82px] w-[min(92vw,430px)] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/25 ${isArabic ? "left-4 md:left-6" : "right-4 md:right-6"}`}
      >
        <span className={`absolute -top-2 h-4 w-4 rotate-45 border-s border-t border-slate-200 bg-white ${isArabic ? "left-6" : "right-6"}`} />

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <BellRing className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700">{typeLabel}</p>
              <h2 className="mt-1 text-lg font-black leading-7 text-slate-900">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={isArabic ? "إغلاق التفاصيل" : "Close details"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {item.body || (isArabic ? "لا توجد تفاصيل إضافية لهذا الإشعار." : "No additional details for this notification.")}
          </p>
        </div>

        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          <InfoRow label={isArabic ? "المصدر" : "Source"} value={entityLabel} />
          <InfoRow label={isArabic ? "الأولوية" : "Priority"} value={priorityLabel} />
          <InfoRow label={isArabic ? "وقت الإشعار" : "Notification time"} value={formattedDate} />
          <InfoRow
            label={isArabic ? "الحالة" : "Status"}
            value={item.is_read ? (isArabic ? "مقروء" : "Read") : (isArabic ? "غير مقروء" : "Unread")}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {isArabic ? "الإشعار مخصص لحسابك وصلاحيتك" : "This alert is scoped to your account and role"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <ArrowUpLeft className={`h-4 w-4 ${isArabic ? "" : "rotate-180"}`} />
              {isArabic ? "رجوع" : "Back"}
            </button>
            {hasSource ? (
              <button
                type="button"
                onClick={onOpenSource}
                disabled={openingSource}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {openingSource ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                {isArabic ? "فتح مصدر الإشعار" : "Open notification source"}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <span className="block text-[10px] font-bold text-slate-400">{label}</span>
      <span className="mt-1 block truncate font-semibold text-slate-700">{value}</span>
    </div>
  );
}
