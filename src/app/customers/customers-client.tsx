"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  full_name: string | null;
  phone?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email?: string | null;
  company_name?: string | null;
  source?: string | null;
  status?: string | null;
  customer_status?: string | null;
  priority?: string | null;
  owner_id?: string | null;
  program?: string | null;
  course_name?: string | null;
  lead_type?: string | null;
  assigned_at?: string | null;
  last_contact_at?: string | null;
  next_follow_up_at?: string | null;
  last_note?: string | null;
  registration_status?: string | null;
  payment_status?: string | null;
  transferred_from?: string | null;
  transferred_to?: string | null;
  transfer_reason?: string | null;
  transferred_at?: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

type Activity = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
};

type Filters = {
  q: string;
  status: string;
  owner: string;
  leadType: string;
  followup: string;
  startDate: string;
  endDate: string;
  course: string;
};

type Props = {
  initialLeads: Lead[];
  initialActivities: Activity[];
  profiles: Profile[];
  currentUserId: string;
  currentUserName: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  initialFilters: Filters;
};

const statusOptions = [
  "interested",
  "not_interested",
  "need_offer",
  "missed",
  "wrong_number",
  "paid",
  "busy",
];

const leadTypeOptions = ["fresh", "retargeted", "redirected"];

const followupOptions = [
  { value: "", ar: "كل المتابعات", en: "All follow-ups" },
  { value: "overdue", ar: "متأخر", en: "Overdue" },
  { value: "today", ar: "اليوم", en: "Today" },
  { value: "tomorrow", ar: "بكرة", en: "Tomorrow" },
  { value: "3days", ar: "بعد 3 أيام", en: "Next 3 days" },
  { value: "7days", ar: "بعد 7 أيام", en: "Next 7 days" },
  { value: "month", ar: "هذا الشهر", en: "This month" },
  { value: "custom", ar: "تاريخ مخصص", en: "Custom" },
];

function statusLabel(value?: string | null) {
  const map: Record<string, string> = {
    interested: "مهتم",
    not_interested: "غير مهتم",
    need_offer: "محتاج عرض",
    missed: "لم يرد",
    wrong_number: "رقم خطأ",
    paid: "مدفوع",
    busy: "مشغول",
    new: "جديد",
    assigned: "موزع",
    contacted: "تم التواصل",
    qualified: "مهتم",
    converted: "تم التسجيل",
    lost: "غير مهتم",
    follow_up: "متابعة",
    registered: "مسجل",
    no_answer: "لم يرد",
  };

  return map[value ?? ""] ?? value ?? "-";
}

function leadTypeLabel(value?: string | null) {
  const map: Record<string, string> = {
    fresh: "جديد",
    retargeted: "إعادة استهداف",
    redirected: "محول",
  };

  return map[value ?? ""] ?? value ?? "-";
}

function actionLabel(value: string) {
  const map: Record<string, string> = {
    status_changed: "تغيير الحالة",
    followup_changed: "تحديد متابعة",
    note_added: "إضافة ملاحظة",
    customer_updated: "تحديث العميل",
    transferred: "تحويل العميل",
  };

  return map[value] ?? value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function phoneDisplay(lead: Lead) {
  const splitPhone = `${lead.country_code ?? ""}${lead.phone_number ?? ""}`.trim();
  return splitPhone || lead.phone || "-";
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, "");
}

function ownerName(profiles: Profile[], ownerId?: string | null) {
  if (!ownerId) return "غير موزع";
  const profile = profiles.find((item) => item.id === ownerId);
  return profile?.full_name ?? profile?.email ?? "غير معروف";
}

function badgeClass(status?: string | null) {
  if (status === "paid") return "bg-emerald-400/15 text-emerald-300 border-emerald-400/20";
  if (status === "interested" || status === "qualified") return "bg-sky-400/15 text-sky-300 border-sky-400/20";
  if (status === "busy") return "bg-amber-400/15 text-amber-300 border-amber-400/20";
  if (status === "wrong_number" || status === "not_interested" || status === "lost") return "bg-red-400/15 text-red-300 border-red-400/20";
  return "bg-white/10 text-slate-300 border-white/10";
}

export function CustomersClient({
  initialLeads,
  initialActivities,
  profiles,
  currentUserId,
  currentUserName,
  role,
  totalCount,
  page,
  pageSize,
  initialFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [selectedId, setSelectedId] = useState<string | null>(initialLeads[0]?.id ?? null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftFollowup, setDraftFollowup] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedId) ?? leads[0] ?? null,
    [leads, selectedId]
  );

  const selectedStatus = selectedLead?.customer_status ?? selectedLead?.status ?? "interested";
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const canEdit = role !== "finance";

  const activitiesByLead = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of activities) {
      const list = map.get(activity.lead_id) ?? [];
      list.push(activity);
      map.set(activity.lead_id, list);
    }
    return map;
  }, [activities]);

  function updateQuery(nextFilters: Partial<Filters>, nextPage = 1, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { ...filters, ...nextFilters };

    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  function setFilter(field: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters() {
    updateQuery(filters, 1, pageSize);
  }

  function resetFilters() {
    const empty = { q: "", status: "", owner: "", leadType: "", followup: "", startDate: "", endDate: "", course: "" };
    setFilters(empty);
    updateQuery(empty, 1, pageSize);
  }

  function goToPage(nextPage: number) {
    updateQuery(filters, Math.min(Math.max(1, nextPage), totalPages), pageSize);
  }

  function changePageSize(value: string) {
    updateQuery(filters, 1, Number(value));
  }

  async function recordActivity(leadId: string, activity: Omit<Activity, "id" | "created_at" | "lead_id" | "actor_id" | "actor_name">) {
    const supabase = createClient();
    const payload = {
      lead_id: leadId,
      actor_id: currentUserId,
      actor_name: currentUserName,
      ...activity,
    };

    const { data } = await supabase
      .from("customer_activities")
      .insert(payload)
      .select("id,lead_id,actor_id,actor_name,action,old_value,new_value,note,created_at")
      .single();

    if (data) {
      setActivities((current) => [data as Activity, ...current]);
    }
  }

  async function saveCustomerUpdate() {
    if (!selectedLead || !canEdit) return;

    setSaving(true);
    setMessage("");
    setError("");

    const nextStatus = draftStatus || selectedStatus;
    const nextFollowup = draftFollowup || selectedLead.next_follow_up_at || null;
    const nextNote = draftNote.trim();
    const now = new Date().toISOString();

    const payload: Record<string, string | null> = {
      status: nextStatus,
      customer_status: nextStatus,
      next_follow_up_at: nextFollowup,
      last_contact_at: now,
    };

    if (nextNote) payload.last_note = nextNote;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", selectedLead.id)
      .select("*")
      .single();

    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "تعذر حفظ التحديث.");
      return;
    }

    const updated = data as Lead;
    setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)));
    setSelectedId(updated.id);

    if (nextStatus !== selectedStatus) {
      await recordActivity(updated.id, {
        action: "status_changed",
        old_value: selectedStatus,
        new_value: nextStatus,
        note: nextNote || null,
      });
    }

    if (nextFollowup !== selectedLead.next_follow_up_at) {
      await recordActivity(updated.id, {
        action: "followup_changed",
        old_value: selectedLead.next_follow_up_at ?? null,
        new_value: nextFollowup,
        note: nextStatus === "busy" ? "متابعة تلقائية لعميل مشغول" : null,
      });
    }

    if (nextNote) {
      await recordActivity(updated.id, {
        action: "note_added",
        old_value: null,
        new_value: null,
        note: nextNote,
      });
    }

    setMessage("تم حفظ التحديث.");
    setDraftStatus("");
    setDraftFollowup("");
    setDraftNote("");
  }

  function timelineForLead(lead: Lead) {
    const generated: Activity[] = [
      {
        id: `${lead.id}-created`,
        lead_id: lead.id,
        actor_id: null,
        actor_name: "النظام",
        action: "customer_updated",
        old_value: null,
        new_value: "تم إنشاء العميل",
        note: lead.source ? `المصدر: ${lead.source}` : null,
        created_at: lead.created_at,
      },
    ];

    if (lead.assigned_at) {
      generated.push({
        id: `${lead.id}-assigned`,
        lead_id: lead.id,
        actor_id: lead.owner_id ?? null,
        actor_name: ownerName(profiles, lead.owner_id),
        action: "transferred",
        old_value: null,
        new_value: "تم التوزيع",
        note: lead.transfer_reason ?? null,
        created_at: lead.assigned_at,
      });
    }

    if (lead.transferred_at) {
      generated.push({
        id: `${lead.id}-transferred`,
        lead_id: lead.id,
        actor_id: lead.transferred_to ?? null,
        actor_name: ownerName(profiles, lead.transferred_to),
        action: "transferred",
        old_value: ownerName(profiles, lead.transferred_from),
        new_value: ownerName(profiles, lead.transferred_to),
        note: lead.transfer_reason ?? null,
        created_at: lead.transferred_at,
      });
    }

    return [...(activitiesByLead.get(lead.id) ?? []), ...generated].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return (
    <div className="space-y-6">
      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-emerald-300">صفحة واحدة لكل العملاء</p>
            <h2 className="mt-1 text-3xl font-black">العملاء</h2>
            <p className="mt-2 text-sm text-slate-400">عرض سريع مناسب للأعداد الكبيرة. اضغط على أي عميل لعرض التفاصيل والرحلة.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
            إجمالي النتائج: <span className="font-black text-white">{totalCount}</span>
          </div>
        </div>
      </section>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {followupOptions.map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              onClick={() => {
                const next = { ...filters, followup: item.value, startDate: item.value === "custom" ? filters.startDate : "", endDate: item.value === "custom" ? filters.endDate : "" };
                setFilters(next);
                updateQuery(next, 1, pageSize);
              }}
              className={
                "rounded-2xl border px-4 py-2 text-sm font-bold transition " +
                (filters.followup === item.value
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10")
              }
            >
              {item.ar}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="xl:col-span-2">
            <span className="mb-2 block text-xs text-slate-500">بحث</span>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-slate-500" />
              <input
                value={filters.q}
                onChange={(event) => setFilter("q", event.target.value)}
                placeholder="اسم / رقم / دورة"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-9 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">الحالة</span>
            <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="">كل الحالات</option>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">السيلز</span>
            <select value={filters.owner} onChange={(event) => setFilter("owner", event.target.value)} disabled={role === "sales"} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400 disabled:opacity-50">
              <option value="">كل السيلز</option>
              {profiles.filter((profile) => profile.role === "sales" || profile.role === "admin" || profile.role === "manager").map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">نوع العميل</span>
            <select value={filters.leadType} onChange={(event) => setFilter("leadType", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="">كل الأنواع</option>
              {leadTypeOptions.map((type) => <option key={type} value={type}>{leadTypeLabel(type)}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">الدورة</span>
            <input value={filters.course} onChange={(event) => setFilter("course", event.target.value)} placeholder="PMP / Excel" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400" />
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">عرض</span>
            <select value={pageSize} onChange={(event) => changePageSize(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>

        {filters.followup === "custom" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400" />
            <input type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400" />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={applyFilters} className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300">تطبيق الفلتر</button>
          <button type="button" onClick={resetFilters} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/10">مسح</button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="safe-card overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-start">العميل</th>
                  <th className="px-4 py-3 text-start">الجوال</th>
                  <th className="px-4 py-3 text-start">الدورة</th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-4 py-3 text-start">السيلز</th>
                  <th className="px-4 py-3 text-start">النوع</th>
                  <th className="px-4 py-3 text-start">المتابعة</th>
                  <th className="px-4 py-3 text-start">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {leads.map((lead) => {
                  const status = lead.customer_status ?? lead.status;
                  const active = selectedLead?.id === lead.id;
                  const phone = phoneDisplay(lead);
                  return (
                    <tr key={lead.id} onClick={() => setSelectedId(lead.id)} className={(active ? "bg-emerald-400/10 " : "") + "cursor-pointer hover:bg-white/[0.04]"}>
                      <td className="px-4 py-4">
                        <div className="font-black text-white">{lead.full_name ?? "بدون اسم"}</div>
                        <div className="mt-1 text-xs text-slate-500">{lead.email ?? lead.source ?? "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-300" dir="ltr">{phone}</td>
                      <td className="px-4 py-4 text-slate-300">{lead.program ?? lead.course_name ?? "-"}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(status)}`}>{statusLabel(status)}</span></td>
                      <td className="px-4 py-4 text-slate-300">{ownerName(profiles, lead.owner_id)}</td>
                      <td className="px-4 py-4 text-slate-300">{leadTypeLabel(lead.lead_type ?? "fresh")}</td>
                      <td className="px-4 py-4 text-slate-300">{shortDate(lead.next_follow_up_at)}</td>
                      <td className="px-4 py-4">
                        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">
                          <Eye className="h-4 w-4" /> التفاصيل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!leads.length ? (
            <div className="p-10 text-center text-slate-400">لا يوجد عملاء مطابقين للفلاتر الحالية.</div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-400">صفحة {page} من {totalPages}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" /> السابق
              </button>
              <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">
                التالي <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className="safe-card sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          {selectedLead ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-emerald-300">تفاصيل العميل</p>
                  <h3 className="mt-1 text-2xl font-black text-white">{selectedLead.full_name ?? "بدون اسم"}</h3>
                  <p className="mt-1 text-sm text-slate-400" dir="ltr">{phoneDisplay(selectedLead)}</p>
                </div>
                <UserRound className="h-8 w-8 text-emerald-300" />
              </div>

              <div className="grid gap-2 text-sm">
                <Info label="الدورة" value={selectedLead.program ?? selectedLead.course_name ?? "-"} />
                <Info label="الحالة" value={statusLabel(selectedLead.customer_status ?? selectedLead.status)} />
                <Info label="السيلز" value={ownerName(profiles, selectedLead.owner_id)} />
                <Info label="نوع العميل" value={leadTypeLabel(selectedLead.lead_type ?? "fresh")} />
                <Info label="آخر تواصل" value={formatDate(selectedLead.last_contact_at)} />
                <Info label="المتابعة القادمة" value={formatDate(selectedLead.next_follow_up_at)} />
                <Info label="آخر ملاحظة" value={selectedLead.last_note ?? "-"} />
              </div>

              <div className="flex flex-wrap gap-2">
                <a href={`tel:${cleanPhone(phoneDisplay(selectedLead))}`} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
                  <Phone className="h-4 w-4" /> اتصال
                </a>
                <a href={`https://wa.me/${cleanPhone(phoneDisplay(selectedLead))}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300">
                  <MessageCircle className="h-4 w-4" /> واتساب
                </a>
              </div>

              {canEdit ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
                  <h4 className="mb-3 font-black text-white">تحديث سريع</h4>
                  <div className="space-y-3">
                    <select value={draftStatus || (selectedLead.customer_status ?? selectedLead.status ?? "interested")} onChange={(event) => setDraftStatus(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400">
                      {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                    </select>

                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-xs text-slate-500"><CalendarClock className="h-4 w-4" /> موعد المتابعة</span>
                      <input type="datetime-local" value={draftFollowup} onChange={(event) => setDraftFollowup(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400" />
                    </label>

                    <textarea value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="اكتب ملاحظة مختصرة..." rows={3} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400" />

                    {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
                    {error ? <p className="text-sm text-red-300">{error}</p> : null}

                    <button type="button" onClick={saveCustomerUpdate} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-60">
                      <RefreshCw className="h-4 w-4" /> {saving ? "جاري الحفظ..." : "حفظ التحديث"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <h4 className="mb-3 flex items-center gap-2 font-black text-white"><Clock3 className="h-4 w-4 text-emerald-300" /> رحلة العميل</h4>
                <div className="space-y-3">
                  {timelineForLead(selectedLead).map((activity) => (
                    <div key={activity.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-white">{actionLabel(activity.action)}</p>
                        <span className="text-xs text-slate-500">{shortDate(activity.created_at)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">بواسطة: {activity.actor_name ?? "النظام"}</p>
                      {(activity.old_value || activity.new_value) ? (
                        <p className="mt-2 text-sm text-slate-300">
                          {activity.old_value ? statusLabel(activity.old_value) + " ← " : ""}{activity.new_value ? statusLabel(activity.new_value) : ""}
                        </p>
                      ) : null}
                      {activity.note ? <p className="mt-2 text-sm leading-6 text-slate-300">{activity.note}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-80 items-center justify-center text-center text-slate-400">
              اختر عميل لعرض التفاصيل.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-56 text-end font-bold text-slate-200">{value}</span>
    </div>
  );
}
