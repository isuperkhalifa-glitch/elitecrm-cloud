"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlarmClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Loader2,
  Phone,
  PhoneCall,
  Search,
  UserRound,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";

const outcomes = [
  { value: "interested", ar: "مهتم", en: "Interested" },
  { value: "need_offer", ar: "يحتاج عرض", en: "Need offer" },
  { value: "busy", ar: "مشغول", en: "Busy" },
  { value: "missed", ar: "لم يرد", en: "No answer" },
  { value: "not_interested", ar: "غير مهتم", en: "Not interested" },
  { value: "wrong_number", ar: "رقم خطأ", en: "Wrong number" },
  { value: "paid", ar: "مدفوع", en: "Paid" },
] as const;

type Outcome = (typeof outcomes)[number]["value"];

type Lead = {
  id: string;
  customer_code: string | null;
  full_name: string | null;
  phone: string | null;
  country_code: string | null;
  phone_number: string | null;
  owner_id: string | null;
  status: string | null;
  customer_status: string | null;
  lead_type: string | null;
  source: string | null;
  program: string | null;
  course_id: string | null;
  priority: string | null;
  next_follow_up_at: string | null;
  last_contact_at: string | null;
  last_note: string | null;
  created_at: string | null;
};

type Course = {
  id: string;
  name: string | null;
  name_ar: string | null;
  name_en: string | null;
  status: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Props = {
  initialLeads: Lead[];
  courses: Course[];
  profiles: Profile[];
  currentUserId: string;
  role: string;
};

function localDateTimeAfter(minutes: number) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
}

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isOverdue(value: string | null) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

export function CallsWorkspaceClient({
  initialLeads,
  courses,
  profiles,
  currentUserId,
  role,
}: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const locale = isArabic ? "ar-EG" : "en-US";

  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState(initialLeads[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState(role === "sales" ? currentUserId : "all");
  const [queueFilter, setQueueFilter] = useState<"all" | "today" | "overdue" | "unassigned">("all");

  const [outcome, setOutcome] = useState<Outcome>("interested");
  const [courseId, setCourseId] = useState(initialLeads[0]?.course_id ?? "");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState(30);
  const [nextFollowUp, setNextFollowUp] = useState(localDateTimeAfter(30));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedLead = leads.find((lead) => lead.id === selectedId) ?? null;

  const visibleLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const status = lead.customer_status ?? lead.status ?? "interested";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (ownerFilter !== "all" && lead.owner_id !== ownerFilter) return false;
      if (queueFilter === "today" && !isToday(lead.next_follow_up_at)) return false;
      if (queueFilter === "overdue" && !isOverdue(lead.next_follow_up_at)) return false;
      if (queueFilter === "unassigned" && lead.owner_id) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        lead.full_name,
        lead.phone,
        lead.customer_code,
        lead.program,
        lead.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [leads, ownerFilter, query, queueFilter, statusFilter]);

  const stats = useMemo(() => {
    const today = leads.filter((lead) => isToday(lead.next_follow_up_at)).length;
    const overdue = leads.filter((lead) => isOverdue(lead.next_follow_up_at)).length;
    const interested = leads.filter((lead) => (lead.customer_status ?? lead.status) === "interested").length;
    const paid = leads.filter((lead) => (lead.customer_status ?? lead.status) === "paid").length;
    return { total: leads.length, today, overdue, interested, paid };
  }, [leads]);

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function leadStatusLabel(value: string | null) {
    const item = outcomes.find((entry) => entry.value === value);
    return item ? tx(item.ar, item.en) : value ?? "-";
  }

  function ownerName(id: string | null) {
    if (!id) return tx("غير موزع", "Unassigned");
    const profile = profiles.find((item) => item.id === id);
    return profile?.full_name ?? profile?.email ?? tx("غير معروف", "Unknown");
  }

  function courseName(id: string | null) {
    if (!id) return "-";
    const course = courses.find((item) => item.id === id);
    return isArabic
      ? course?.name_ar ?? course?.name ?? course?.name_en ?? id
      : course?.name_en ?? course?.name ?? course?.name_ar ?? id;
  }

  function selectLead(lead: Lead) {
    setSelectedId(lead.id);
    setCourseId(lead.course_id ?? "");
    setOutcome(((lead.customer_status ?? lead.status) as Outcome) || "interested");
    setNote(lead.last_note ?? "");
    setDuration(30);
    setNextFollowUp(localDateTimeAfter(30));
    setMessage("");
    setError("");
  }

  function chooseDuration(minutes: number) {
    setDuration(minutes);
    setNextFollowUp(localDateTimeAfter(minutes));
  }

  async function processCall() {
    if (!selectedLead) return;
    setSaving(true);
    setMessage("");
    setError("");

    const response = await fetch(`/api/v1/calls/${selectedLead.id}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outcome,
        course_id: courseId || null,
        note,
        duration_minutes: outcome === "busy" ? duration : null,
        next_follow_up_at: outcome === "busy" && nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
      }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result.message ?? tx("تعذر حفظ نتيجة المكالمة.", "Unable to save call result."));
      return;
    }

    const updated = result.data as Lead;
    setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)));
    setMessage(result.message ?? tx("تم حفظ نتيجة المكالمة.", "Call result saved."));

    const currentIndex = visibleLeads.findIndex((lead) => lead.id === selectedLead.id);
    const nextLead = visibleLeads[currentIndex + 1] ?? visibleLeads[0];
    if (nextLead && nextLead.id !== selectedLead.id) {
      window.setTimeout(() => selectLead(nextLead), 400);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label={tx("إجمالي قائمة الاتصال", "Call queue")} value={stats.total} />
        <Metric label={tx("متابعات اليوم", "Today follow-ups")} value={stats.today} tone="blue" />
        <Metric label={tx("متأخر", "Overdue")} value={stats.overdue} tone="red" />
        <Metric label={tx("مهتم", "Interested")} value={stats.interested} tone="green" />
        <Metric label={tx("مدفوع", "Paid")} value={stats.paid} tone="green" />
      </div>

      <div className="v8-card rounded-md p-3">
        <div className="grid gap-2 lg:grid-cols-[1fr_190px_190px_180px]">
          <label className="relative block">
            <Search className="v8-muted absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tx("بحث بالاسم أو الرقم أو الكود أو الدورة", "Search name, phone, code, or course")}
              className="w-full rounded border px-9 py-2.5 text-sm outline-none"
              style={{ borderColor: "var(--v8-border)", background: "var(--v8-panel-muted)" }}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded border px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--v8-border)", background: "var(--v8-panel-muted)" }}
          >
            <option value="all">{tx("كل الحالات", "All statuses")}</option>
            {outcomes.map((item) => (
              <option key={item.value} value={item.value}>{tx(item.ar, item.en)}</option>
            ))}
          </select>

          <select
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            disabled={role === "sales"}
            className="rounded border px-3 py-2.5 text-sm disabled:opacity-60"
            style={{ borderColor: "var(--v8-border)", background: "var(--v8-panel-muted)" }}
          >
            <option value="all">{tx("كل المستخدمين", "All users")}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>
            ))}
          </select>

          <select
            value={queueFilter}
            onChange={(event) => setQueueFilter(event.target.value as typeof queueFilter)}
            className="rounded border px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--v8-border)", background: "var(--v8-panel-muted)" }}
          >
            <option value="all">{tx("كل القائمة", "All queue")}</option>
            <option value="today">{tx("متابعات اليوم", "Today follow-ups")}</option>
            <option value="overdue">{tx("المتأخر", "Overdue")}</option>
            <option value="unassigned">{tx("غير موزع", "Unassigned")}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="v8-card max-h-[720px] overflow-hidden rounded-md">
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--v8-border)" }}>
            <div>
              <h2 className="v8-heading font-semibold">{tx("قائمة الاتصال", "Call queue")}</h2>
              <p className="v8-muted mt-1 text-xs">{visibleLeads.length} {tx("عميل", "customers")}</p>
            </div>
            <Filter className="v8-muted h-5 w-5" />
          </div>

          <div className="max-h-[660px] overflow-y-auto p-2">
            {visibleLeads.map((lead) => {
              const active = lead.id === selectedId;
              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => selectLead(lead)}
                  className={`mb-2 w-full rounded border p-3 text-start transition ${active ? "v8-button-active" : "v8-toolbar"}`}
                  style={{ borderColor: active ? "var(--v8-accent)" : "var(--v8-border)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="v8-heading truncate font-semibold">{lead.full_name ?? tx("بدون اسم", "Unnamed")}</p>
                      <p className="v8-muted mt-1 truncate text-xs" dir="ltr">{lead.phone ?? "-"}</p>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                      {leadStatusLabel(lead.customer_status ?? lead.status)}
                    </span>
                  </div>
                  <div className="v8-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                    <span>{lead.customer_code ?? "-"}</span>
                    <span>{lead.program ?? "-"}</span>
                    <span>{ownerName(lead.owner_id)}</span>
                  </div>
                  {lead.next_follow_up_at ? (
                    <p className={`mt-2 flex items-center gap-1 text-[11px] ${isOverdue(lead.next_follow_up_at) ? "text-red-600" : "v8-muted"}`}>
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(lead.next_follow_up_at, locale)}
                    </p>
                  ) : null}
                </button>
              );
            })}

            {!visibleLeads.length ? (
              <div className="v8-muted py-16 text-center text-sm">{tx("لا توجد نتائج", "No results")}</div>
            ) : null}
          </div>
        </section>

        <section className="v8-card rounded-md p-4 md:p-5">
          {selectedLead ? (
            <>
              <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between" style={{ borderColor: "var(--v8-border)" }}>
                <div>
                  <p className="text-xs font-semibold text-emerald-600">{selectedLead.customer_code ?? selectedLead.id}</p>
                  <h2 className="v8-heading mt-1 text-2xl font-bold">{selectedLead.full_name ?? tx("بدون اسم", "Unnamed")}</h2>
                  <div className="v8-muted mt-2 flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{selectedLead.phone ?? "-"}</span>
                    <span className="inline-flex items-center gap-1"><UserRound className="h-4 w-4" />{ownerName(selectedLead.owner_id)}</span>
                  </div>
                </div>
                <Link
                  href={`/customers/${selectedLead.customer_code ?? selectedLead.id}`}
                  className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  {tx("فتح ملف العميل", "Open customer")}
                </Link>
              </div>

              <div className="mt-5">
                <p className="v8-heading mb-2 text-sm font-semibold">{tx("نتيجة المكالمة", "Call result")}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {outcomes.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setOutcome(item.value)}
                      className={`rounded border px-3 py-3 text-sm font-semibold ${outcome === item.value ? "v8-button-active" : "v8-button"}`}
                    >
                      {tx(item.ar, item.en)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="v8-heading mb-2 block text-sm font-semibold">{tx("الدورة", "Course")}</span>
                  <select
                    value={courseId}
                    onChange={(event) => setCourseId(event.target.value)}
                    className="w-full rounded border px-3 py-2.5 text-sm"
                    style={{ borderColor: "var(--v8-border)", background: "var(--v8-panel-muted)" }}
                  >
                    <option value="">{tx("بدون دورة", "No course")}</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {isArabic ? course.name_ar ?? course.name ?? course.name_en : course.name_en ?? course.name ?? course.name_ar}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="v8-heading mb-2 block text-sm font-semibold">{tx("الدورة الحالية", "Current course")}</span>
                  <div className="v8-toolbar rounded border px-3 py-2.5 text-sm">{courseName(selectedLead.course_id) || selectedLead.program || "-"}</div>
                </div>
              </div>

              {outcome === "busy" ? (
                <div className="mt-5 rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlarmClock className="h-5 w-5" />
                    {tx("حدد موعد الاتصال القادم", "Set next call time")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[15, 30, 60, 120, 1440].map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => chooseDuration(minutes)}
                        className={`rounded border px-3 py-2 text-sm ${duration === minutes ? "border-amber-600 bg-amber-200" : "border-amber-300 bg-white"}`}
                      >
                        {minutes === 1440 ? tx("غدًا", "Tomorrow") : `${minutes} ${tx("دقيقة", "min")}`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="datetime-local"
                    value={nextFollowUp}
                    onChange={(event) => setNextFollowUp(event.target.value)}
                    className="mt-3 w-full rounded border border-amber-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>
              ) : null}

              <label className="mt-5 block">
                <span className="v8-heading mb-2 block text-sm font-semibold">{tx("ملاحظات المكالمة", "Call notes")}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={5}
                  placeholder={tx("اكتب ملخص المكالمة والخطوة القادمة...", "Write call summary and next step...")}
                  className="w-full rounded border px-3 py-3 text-sm outline-none"
                  style={{ borderColor: "var(--v8-border)", background: "var(--v8-panel-muted)" }}
                />
              </label>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={processCall}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                  {saving ? tx("جاري الحفظ...", "Saving...") : tx("حفظ والانتقال للتالي", "Save and move next")}
                </button>
                {message ? <span className="inline-flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />{message}</span> : null}
                {error ? <span className="text-sm text-red-600">{error}</span> : null}
              </div>

              <div className="v8-toolbar mt-5 grid gap-3 rounded border p-4 md:grid-cols-3">
                <Info label={tx("آخر تواصل", "Last contact")} value={formatDate(selectedLead.last_contact_at, locale)} />
                <Info label={tx("المتابعة القادمة", "Next follow-up")} value={formatDate(selectedLead.next_follow_up_at, locale)} />
                <Info label={tx("آخر ملاحظة", "Last note")} value={selectedLead.last_note ?? "-"} />
              </div>
            </>
          ) : (
            <div className="v8-muted flex min-h-[520px] items-center justify-center text-sm">
              {tx("اختر عميلًا من قائمة الاتصال", "Select a customer from the call queue")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "blue" | "red" | "green" }) {
  const toneClass = tone === "blue" ? "text-sky-600" : tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-600" : "v8-heading";
  return (
    <div className="v8-card rounded-md p-4">
      <p className="v8-muted text-xs">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="v8-muted text-xs">{label}</p>
      <p className="v8-heading mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
