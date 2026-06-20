"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  MinusCircle,
  PhoneCall,
  PlusCircle,
  Printer,
  Search,
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
  last_call_at: string | null;
  last_note: string | null;
  created_at: string | null;
  assigned_by: string | null;
  intake_by: string | null;
  queue_type: string | null;
  redirected_date: string | null;
  call_sender_id?: string | null;
  call_receiver_id?: string | null;
  connection_type?: string | null;
  caller_mobile?: string | null;
  second_number?: string | null;
  system_source?: string | null;
  received_at?: string | null;
  call_deadline_at?: string | null;
  call_done_at?: string | null;
  call_done_description?: string | null;
  education_level?: string | null;
  city?: string | null;
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
  initialFilter: string;
  enhancedSchemaReady: boolean;
};

type Preset =
  | "all"
  | "ivr"
  | "distributed"
  | "unfinished"
  | "finished"
  | "interested"
  | "not_interested"
  | "need_offer"
  | "wrong_number"
  | "paid"
  | "busy"
  | "received_today"
  | "redirected"
  | "missed"
  | "deadline_today";

function localDateTimeAfter(minutes: number) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(value: string | null | undefined, target = new Date()) {
  const date = safeDate(value);
  if (!date) return false;
  return date.toDateString() === target.toDateString();
}

function inDateRange(value: string | null | undefined, from: string, to: string) {
  if (!from && !to) return true;
  const date = safeDate(value);
  if (!date) return false;
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (date < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (date > end) return false;
  }
  return true;
}

function normalizePreset(value: string): Preset {
  const allowed: Preset[] = [
    "all",
    "ivr",
    "distributed",
    "unfinished",
    "finished",
    "interested",
    "not_interested",
    "need_offer",
    "wrong_number",
    "paid",
    "busy",
    "received_today",
    "redirected",
    "missed",
    "deadline_today",
  ];
  return allowed.includes(value as Preset) ? (value as Preset) : "all";
}

export function CallsCenterClient({
  initialLeads,
  courses,
  profiles,
  currentUserId,
  role,
  initialFilter,
  enhancedSchemaReady,
}: Props) {
  const router = useRouter();
  const { language } = useI18n();
  const isArabic = language === "ar";
  const locale = isArabic ? "ar-EG" : "en-US";
  const tx = (ar: string, en: string) => (isArabic ? ar : en);

  const [leads, setLeads] = useState(initialLeads);
  const [preset, setPreset] = useState<Preset>(normalizePreset(initialFilter));
  const [sourceFilter, setSourceFilter] = useState("all");
  const [connectionFilter, setConnectionFilter] = useState("all");
  const [senderFilter, setSenderFilter] = useState("all");
  const [receiverFilter, setReceiverFilter] = useState(role === "sales" ? currentUserId : "all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [doneFrom, setDoneFrom] = useState("");
  const [doneTo, setDoneTo] = useState("");
  const [doneDescriptionFilter, setDoneDescriptionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("interested");
  const [courseId, setCourseId] = useState("");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState(30);
  const [nextFollowUp, setNextFollowUp] = useState(localDateTimeAfter(30));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const profileMap = useMemo(() => new Map(profiles.map((item) => [item.id, item])), [profiles]);

  function senderId(lead: Lead) {
    return lead.call_sender_id ?? lead.assigned_by ?? lead.intake_by ?? null;
  }

  function receiverId(lead: Lead) {
    return lead.call_receiver_id ?? lead.owner_id ?? null;
  }

  function connectionType(lead: Lead) {
    if (lead.connection_type) return lead.connection_type;
    if (lead.lead_type === "redirected" || lead.redirected_date) return "redirected";
    if ((lead.source ?? "").toLowerCase().includes("ivr")) return "ivr";
    if (lead.queue_type === "manual") return "manual";
    return lead.owner_id ? "distributed" : "manual";
  }

  function receivedAt(lead: Lead) {
    return lead.received_at ?? lead.created_at;
  }

  function deadlineAt(lead: Lead) {
    return lead.call_deadline_at ?? lead.next_follow_up_at;
  }

  function doneAt(lead: Lead) {
    return lead.call_done_at ?? lead.last_call_at ?? lead.last_contact_at;
  }

  function doneDescription(lead: Lead) {
    return lead.call_done_description ?? lead.last_note ?? "";
  }

  function statusValue(lead: Lead) {
    return lead.customer_status ?? lead.status ?? "";
  }

  function profileName(id: string | null) {
    if (!id) return tx("غير محدد", "Not set");
    const profile = profileMap.get(id);
    return profile?.full_name ?? profile?.email ?? id;
  }

  function courseName(id: string | null, fallback?: string | null) {
    const course = courses.find((item) => item.id === id);
    if (!course) return fallback ?? "-";
    return isArabic
      ? course.name_ar ?? course.name ?? course.name_en ?? fallback ?? "-"
      : course.name_en ?? course.name ?? course.name_ar ?? fallback ?? "-";
  }

  function formatDate(value: string | null | undefined) {
    const date = safeDate(value);
    if (!date) return "-";
    return date.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
  }

  function statusLabel(value: string) {
    const item = outcomes.find((entry) => entry.value === value);
    return item ? tx(item.ar, item.en) : value || tx("غير محدد", "Not set");
  }

  function connectionLabel(value: string) {
    if (value === "distributed") return tx("موزع", "Distributed");
    if (value === "ivr") return tx("رد آلي", "IVR");
    if (value === "redirected") return tx("محوّل", "Redirected");
    return tx("يدوي", "Manual");
  }

  function presetMatches(lead: Lead) {
    const status = statusValue(lead);
    const deadline = deadlineAt(lead);
    const done = doneAt(lead);
    const connection = connectionType(lead);

    if (preset === "all") return true;
    if (preset === "ivr") return connection === "ivr";
    if (preset === "distributed") return connection === "distributed";
    if (preset === "unfinished") return !done;
    if (preset === "finished") return Boolean(done);
    if (preset === "interested") return status === "interested";
    if (preset === "not_interested") return status === "not_interested";
    if (preset === "need_offer") return status === "need_offer";
    if (preset === "wrong_number") return status === "wrong_number";
    if (preset === "paid") return status === "paid";
    if (preset === "busy") return status === "busy";
    if (preset === "received_today") return sameDay(receivedAt(lead));
    if (preset === "redirected") return connection === "redirected";
    if (preset === "deadline_today") return sameDay(deadline);
    if (preset === "missed") {
      if (status === "missed") return true;
      const deadlineDate = safeDate(deadline);
      return !done && Boolean(deadlineDate && deadlineDate.getTime() < Date.now());
    }
    return true;
  }

  const sources = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.source).filter((value): value is string => Boolean(value)))).sort(),
    [leads]
  );
  const cities = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.city).filter((value): value is string => Boolean(value)))).sort(),
    [leads]
  );
  const educationLevels = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.education_level).filter((value): value is string => Boolean(value)))).sort(),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const doneKeyword = doneDescriptionFilter.trim().toLowerCase();

    return leads.filter((lead) => {
      if (!presetMatches(lead)) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (connectionFilter !== "all" && connectionType(lead) !== connectionFilter) return false;
      if (senderFilter !== "all" && senderId(lead) !== senderFilter) return false;
      if (receiverFilter !== "all" && receiverId(lead) !== receiverFilter) return false;
      if (courseFilter !== "all" && lead.course_id !== courseFilter && lead.program !== courseFilter) return false;
      if (educationFilter !== "all" && lead.education_level !== educationFilter) return false;
      if (cityFilter !== "all" && lead.city !== cityFilter) return false;
      if (!inDateRange(receivedAt(lead), createdFrom, createdTo)) return false;
      if (!inDateRange(deadlineAt(lead), deadlineFrom, deadlineTo)) return false;
      if (!inDateRange(doneAt(lead), doneFrom, doneTo)) return false;
      if (doneKeyword && !doneDescription(lead).toLowerCase().includes(doneKeyword)) return false;

      if (!keyword) return true;
      const numbers = [lead.phone, lead.phone_number, lead.caller_mobile, lead.second_number].filter(Boolean).join(" ");
      const haystack = [
        lead.customer_code,
        lead.full_name,
        numbers,
        lead.source,
        lead.system_source,
        lead.program,
        profileName(senderId(lead)),
        profileName(receiverId(lead)),
        doneDescription(lead),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [
    leads,
    preset,
    sourceFilter,
    connectionFilter,
    senderFilter,
    receiverFilter,
    courseFilter,
    educationFilter,
    cityFilter,
    createdFrom,
    createdTo,
    deadlineFrom,
    deadlineTo,
    doneFrom,
    doneTo,
    doneDescriptionFilter,
    search,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedLeads = filteredLeads.slice((safePage - 1) * pageSize, safePage * pageSize);

  function setPresetFilter(value: string) {
    const next = normalizePreset(value);
    setPreset(next);
    setPage(1);
    router.replace(`/calls?filter=${next}`, { scroll: false });
  }

  function openLead(lead: Lead) {
    if (expandedId === lead.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(lead.id);
    setOutcome((statusValue(lead) as Outcome) || "interested");
    setCourseId(lead.course_id ?? "");
    setNote(doneDescription(lead));
    setDuration(30);
    setNextFollowUp(localDateTimeAfter(30));
    setMessage("");
    setError("");
  }

  function chooseDuration(minutes: number) {
    setDuration(minutes);
    setNextFollowUp(localDateTimeAfter(minutes));
  }

  async function processCall(lead: Lead) {
    setSaving(true);
    setMessage("");
    setError("");

    const response = await fetch(`/api/v1/calls/${lead.id}/process`, {
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
    setLeads((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    setMessage(result.message ?? tx("تم حفظ نتيجة المكالمة.", "Call result saved."));
  }

  function exportRows() {
    return filteredLeads.map((lead) => ({
      [tx("معرف المكالمة", "Call ID")]: lead.customer_code ?? lead.id,
      [tx("المرسل", "Sender")]: profileName(senderId(lead)),
      [tx("المستلم", "Receiver")]: profileName(receiverId(lead)),
      [tx("اسم العميل", "Customer name")]: lead.full_name ?? "",
      [tx("رقم العميل", "Customer mobile")]: lead.phone ?? lead.phone_number ?? "",
      [tx("رقم المتصل", "Caller mobile")]: lead.caller_mobile ?? lead.phone ?? "",
      [tx("الرقم الثاني", "Second number")]: lead.second_number ?? "",
      [tx("المصدر", "Source")]: lead.source ?? "",
      [tx("مصدر النظام", "System source")]: lead.system_source ?? lead.queue_type ?? "",
      [tx("تاريخ الاستلام", "Received at")]: formatDate(receivedAt(lead)),
      [tx("الموعد النهائي", "Deadline")]: formatDate(deadlineAt(lead)),
      [tx("الحالة", "Status")]: statusLabel(statusValue(lead)),
      [tx("تم في", "Done at")]: formatDate(doneAt(lead)),
      [tx("النتيجة", "Result")]: doneDescription(lead),
    }));
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(exportRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, tx("المكالمات", "Calls"));
    XLSX.writeFile(workbook, `elitecrm-calls-${preset}.xlsx`);
  }

  async function copyRows() {
    const rows = exportRows();
    const keys = Object.keys(rows[0] ?? {});
    const text = [keys.join("\t"), ...rows.map((row) => keys.map((key) => String(row[key] ?? "")).join("\t"))].join("\n");
    await navigator.clipboard.writeText(text);
    setMessage(tx("تم نسخ البيانات.", "Data copied."));
  }

  function resetFilters() {
    setPresetFilter("all");
    setSourceFilter("all");
    setConnectionFilter("all");
    setSenderFilter("all");
    setReceiverFilter(role === "sales" ? currentUserId : "all");
    setCourseFilter("all");
    setEducationFilter("all");
    setCityFilter("all");
    setCreatedFrom("");
    setCreatedTo("");
    setDeadlineFrom("");
    setDeadlineTo("");
    setDoneFrom("");
    setDoneTo("");
    setDoneDescriptionFilter("");
    setSearch("");
    setPage(1);
  }

  return (
    <section className="v8-card rounded-md p-4">
      {!enhancedSchemaReady ? (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {tx(
            "صفحة المكالمات تعمل بالحقول الأساسية. شغّل ملف قاعدة البيانات V8.5 لتفعيل جميع الفلاتر والحقول.",
            "Calls are running with basic fields. Run the V8.5 database file to enable every filter and field."
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--v8-border)" }}>
        <div>
          <h2 className="v8-heading text-xl font-semibold">{tx("المكالمات الواردة", "Incoming calls")}</h2>
          <p className="v8-muted mt-1 text-xs">{tx("إدارة وتشغيل ومراجعة جميع مكالمات العملاء", "Manage, process, and review all customer calls")}</p>
        </div>
        <button type="button" onClick={resetFilters} className="v8-button rounded px-3 py-2 text-sm">
          {tx("مسح الفلاتر", "Clear filters")}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <FilterField label={tx("حسب الفلتر", "By filter")}>
          <select value={preset} onChange={(event) => setPresetFilter(event.target.value)} className="v8-input w-full rounded border px-3 py-2 text-sm">
            <option value="all">{tx("الكل", "Any")}</option>
            <option value="ivr">{tx("مكالمات الرد الآلي", "IVR calls")}</option>
            <option value="distributed">{tx("المكالمات الموزعة", "Distributed calls")}</option>
            <option value="unfinished">{tx("المكالمات غير المنتهية", "Unfinished calls")}</option>
            <option value="finished">{tx("المكالمات المنتهية", "Finished calls")}</option>
            <option value="interested">{tx("المهتمون", "Interested")}</option>
            <option value="paid">{tx("تم التسجيل والدفع", "With deal")}</option>
            <option value="not_interested">{tx("غير مهتم", "Not interested")}</option>
            <option value="need_offer">{tx("يحتاج عرض", "Need offer")}</option>
            <option value="busy">{tx("مشغول", "Busy")}</option>
            <option value="wrong_number">{tx("رقم خطأ", "Wrong number")}</option>
            <option value="received_today">{tx("المستلمة اليوم", "Received today")}</option>
            <option value="redirected">{tx("المحوّلة إليك", "Redirected to you")}</option>
            <option value="missed">{tx("المكالمات الفائتة", "Missed")}</option>
            <option value="deadline_today">{tx("موعدها اليوم", "Deadline today")}</option>
          </select>
        </FilterField>

        <FilterField label={tx("حسب المصدر", "By source")}>
          <select value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm">
            <option value="all">{tx("كل المصادر", "All sources")}</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </FilterField>

        <FilterField label={tx("حالة الاتصال", "Connection status")}>
          <select value={connectionFilter} onChange={(event) => { setConnectionFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm">
            <option value="all">{tx("الكل", "All")}</option>
            <option value="distributed">{tx("موزع", "Distributed")}</option>
            <option value="ivr">{tx("رد آلي", "IVR")}</option>
            <option value="manual">{tx("إدخال يدوي", "Manually entered")}</option>
            <option value="redirected">{tx("محوّل", "Redirected")}</option>
          </select>
        </FilterField>

        <DateRangeField label={tx("تاريخ الإنشاء", "Created date")} from={createdFrom} to={createdTo} setFrom={setCreatedFrom} setTo={setCreatedTo} />
        <DateRangeField label={tx("الموعد النهائي", "Deadline date")} from={deadlineFrom} to={deadlineTo} setFrom={setDeadlineFrom} setTo={setDeadlineTo} />
        <DateRangeField label={tx("تاريخ التنفيذ", "Done at date")} from={doneFrom} to={doneTo} setFrom={setDoneFrom} setTo={setDoneTo} />

        <FilterField label={tx("حسب المرسل", "By sender")}>
          <select value={senderFilter} onChange={(event) => { setSenderFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm">
            <option value="all">{tx("كل المرسلين", "All senders")}</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>)}
          </select>
        </FilterField>

        <FilterField label={tx("حسب المستلم", "By receiver")}>
          <select value={receiverFilter} disabled={role === "sales"} onChange={(event) => { setReceiverFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm disabled:opacity-60">
            <option value="all">{tx("كل المستلمين", "All receivers")}</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>)}
          </select>
        </FilterField>

        <FilterField label={tx("حسب الدورة", "By course")}>
          <select value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm">
            <option value="all">{tx("أي دورة", "Any")}</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{courseName(course.id)}</option>)}
          </select>
        </FilterField>

        <FilterField label={tx("المؤهل التعليمي", "Education degree")}>
          <select value={educationFilter} onChange={(event) => { setEducationFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm">
            <option value="all">{tx("أي مؤهل", "Any")}</option>
            {educationLevels.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </FilterField>

        <FilterField label={tx("حسب المدينة", "By city")}>
          <select value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm">
            <option value="all">{tx("كل المدن", "All cities")}</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </FilterField>

        <FilterField label={tx("وصف التنفيذ", "Done description")}>
          <input value={doneDescriptionFilter} onChange={(event) => { setDoneDescriptionFilter(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2 text-sm" />
        </FilterField>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--v8-border)" }}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{tx("عرض", "Show")}</span>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="v8-input rounded border px-2 py-2 text-sm">
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <span>{tx("سجل", "entries")}</span>
          <button type="button" onClick={() => window.print()} className="v8-button inline-flex items-center gap-1 rounded px-3 py-2"><Printer className="h-4 w-4" />{tx("طباعة", "Print")}</button>
          <button type="button" onClick={exportExcel} className="v8-button inline-flex items-center gap-1 rounded px-3 py-2"><FileSpreadsheet className="h-4 w-4" />{tx("إكسل", "Excel")}</button>
          <button type="button" onClick={copyRows} className="v8-button inline-flex items-center gap-1 rounded px-3 py-2"><Clipboard className="h-4 w-4" />{tx("نسخ", "Copy")}</button>
          <button type="button" onClick={exportExcel} className="v8-button inline-flex items-center gap-1 rounded px-3 py-2"><Download className="h-4 w-4" />{tx("تنزيل الكل", "Download all")}</button>
        </div>

        <label className="relative block w-full max-w-xs">
          <Search className="v8-muted absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={tx("بحث", "Search")} className="v8-input w-full rounded border py-2 pe-3 ps-9 text-sm" />
        </label>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto border-y" style={{ borderColor: "var(--v8-border)" }}>
        <table className="w-full min-w-[1900px] border-collapse text-sm">
          <thead className="v8-toolbar text-xs">
            <tr>
              <Th>{tx("معرف المكالمة", "Call ID")}</Th>
              <Th>{tx("المرسل", "Sender")}</Th>
              <Th>{tx("المستلم", "Receiver")}</Th>
              <Th>{tx("اسم العميل", "Customer name")}</Th>
              <Th>{tx("كل الأرقام", "All numbers")}</Th>
              <Th>{tx("رقم العميل", "Customer mobile")}</Th>
              <Th>{tx("رقم المتصل", "Caller mobile")}</Th>
              <Th>{tx("الرقم الثاني", "Second number")}</Th>
              <Th>{tx("المصدر", "Source")}</Th>
              <Th>{tx("مصدر النظام", "System source")}</Th>
              <Th>{tx("تاريخ الاستلام", "Received at")}</Th>
              <Th>{tx("الموعد النهائي", "Deadline")}</Th>
              <Th>{tx("الحالة", "Status")}</Th>
              <Th>{tx("تم في", "Done at")}</Th>
              <Th>{tx("النتيجة", "Result")}</Th>
              <Th>{tx("التفاصيل", "Details")}</Th>
              <Th>{tx("الإجراء", "Action")}</Th>
            </tr>
          </thead>
          <tbody>
            {pagedLeads.map((lead) => {
              const expanded = expandedId === lead.id;
              const numbers = [lead.phone, lead.caller_mobile, lead.second_number].filter(Boolean).join(" / ");
              return (
                <TableLeadRows
                  key={lead.id}
                  lead={lead}
                  expanded={expanded}
                  rowClass={rowClassName(lead, deadlineAt(lead), doneAt(lead))}
                  onToggle={() => openLead(lead)}
                  sender={profileName(senderId(lead))}
                  receiver={profileName(receiverId(lead))}
                  allNumbers={numbers || "-"}
                  customerMobile={lead.phone ?? lead.phone_number ?? "-"}
                  callerMobile={lead.caller_mobile ?? lead.phone ?? "-"}
                  secondNumber={lead.second_number ?? "-"}
                  systemSource={lead.system_source ?? lead.queue_type ?? "-"}
                  received={formatDate(receivedAt(lead))}
                  deadline={formatDate(deadlineAt(lead))}
                  status={statusLabel(statusValue(lead))}
                  done={formatDate(doneAt(lead))}
                  result={statusLabel(statusValue(lead))}
                  details={doneDescription(lead) || "-"}
                  connection={connectionLabel(connectionType(lead))}
                  isArabic={isArabic}
                >
                  <CallProcessingPanel
                    lead={lead}
                    outcomes={outcomes}
                    outcome={outcome}
                    setOutcome={setOutcome}
                    courses={courses}
                    courseId={courseId}
                    setCourseId={setCourseId}
                    note={note}
                    setNote={setNote}
                    duration={duration}
                    chooseDuration={chooseDuration}
                    nextFollowUp={nextFollowUp}
                    setNextFollowUp={setNextFollowUp}
                    saving={saving}
                    processCall={() => processCall(lead)}
                    isArabic={isArabic}
                    currentCourse={courseName(lead.course_id, lead.program)}
                  />
                </TableLeadRows>
              );
            })}

            {!pagedLeads.length ? (
              <tr><td colSpan={17} className="v8-muted py-16 text-center">{tx("لا توجد مكالمات مطابقة", "No matching calls")}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="v8-muted">
          {tx(`عرض ${pagedLeads.length} من ${filteredLeads.length}`, `Showing ${pagedLeads.length} of ${filteredLeads.length}`)}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="v8-button rounded p-2 disabled:opacity-40">
            {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <span className="v8-heading min-w-20 text-center font-semibold">{safePage} / {totalPages}</span>
          <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="v8-button rounded p-2 disabled:opacity-40">
            {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}

function rowClassName(lead: Lead, deadlineValue: string | null, doneValue: string | null) {
  const deadline = safeDate(deadlineValue);
  const done = safeDate(doneValue);
  if (done) {
    if (deadline && done.getTime() > deadline.getTime()) {
      return "bg-amber-100/90 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100";
    }
    return "bg-emerald-100/90 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100";
  }
  if (deadline && deadline.getTime() < Date.now()) {
    return "bg-red-100/90 text-red-950 dark:bg-red-950/40 dark:text-red-100";
  }
  if (lead.priority === "urgent") return "bg-orange-50 dark:bg-orange-950/20";
  return "bg-white dark:bg-slate-900/40";
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="v8-heading mb-1.5 block text-xs font-semibold">{label}</span>{children}</label>;
}

function DateRangeField({
  label,
  from,
  to,
  setFrom,
  setTo,
}: {
  label: string;
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
}) {
  return (
    <FilterField label={label}>
      <div className="grid grid-cols-2 gap-1">
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="v8-input min-w-0 rounded border px-2 py-2 text-xs" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="v8-input min-w-0 rounded border px-2 py-2 text-xs" />
      </div>
    </FilterField>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap border-b px-3 py-3 text-start font-semibold" style={{ borderColor: "var(--v8-border)" }}>{children}</th>;
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-t px-3 py-3 align-top ${className}`} style={{ borderColor: "var(--v8-border)" }}>{children}</td>;
}

function TableLeadRows({
  lead,
  expanded,
  rowClass,
  onToggle,
  sender,
  receiver,
  allNumbers,
  customerMobile,
  callerMobile,
  secondNumber,
  systemSource,
  received,
  deadline,
  status,
  done,
  result,
  details,
  connection,
  isArabic,
  children,
}: {
  lead: Lead;
  expanded: boolean;
  rowClass: string;
  onToggle: () => void;
  sender: string;
  receiver: string;
  allNumbers: string;
  customerMobile: string;
  callerMobile: string;
  secondNumber: string;
  systemSource: string;
  received: string;
  deadline: string;
  status: string;
  done: string;
  result: string;
  details: string;
  connection: string;
  isArabic: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <tr className={rowClass}>
        <Td>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onToggle} className="text-sky-600" aria-label={expanded ? "collapse" : "expand"}>
              {expanded ? <MinusCircle className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </button>
            <span className="font-mono text-xs font-bold">{lead.customer_code ?? lead.id.slice(0, 8)}</span>
          </div>
        </Td>
        <Td>{sender}</Td>
        <Td>{receiver}</Td>
        <Td><span className="font-semibold">{lead.full_name ?? (isArabic ? "بدون اسم" : "Unnamed")}</span></Td>
        <Td className="max-w-64"><span dir="ltr" className="break-words text-xs">{allNumbers}</span></Td>
        <Td><span dir="ltr">{customerMobile}</span></Td>
        <Td><span dir="ltr">{callerMobile}</span></Td>
        <Td><span dir="ltr">{secondNumber}</span></Td>
        <Td>{lead.source ?? "-"}</Td>
        <Td><div>{systemSource}</div><div className="mt-1 text-[11px] opacity-70">{connection}</div></Td>
        <Td>{received}</Td>
        <Td>{deadline}</Td>
        <Td><span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold dark:bg-black/20">{status}</span></Td>
        <Td>{done}</Td>
        <Td>{result}</Td>
        <Td className="max-w-72"><p className="line-clamp-2 text-xs leading-5">{details}</p></Td>
        <Td>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onToggle} className="inline-flex items-center gap-1 rounded bg-[#29455f] px-3 py-2 text-xs font-semibold text-white">
              <PhoneCall className="h-3.5 w-3.5" />
              {isArabic ? "تشغيل" : "Process"}
            </button>
            <Link href={`/customers/${lead.customer_code ?? lead.id}`} className="v8-button rounded p-2" aria-label={isArabic ? "فتح العميل" : "Open customer"}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Td>
      </tr>
      {expanded ? <tr><td colSpan={17} className="border-t p-0" style={{ borderColor: "var(--v8-border)" }}>{children}</td></tr> : null}
    </>
  );
}

function CallProcessingPanel({
  lead,
  outcomes: outcomeItems,
  outcome,
  setOutcome,
  courses,
  courseId,
  setCourseId,
  note,
  setNote,
  duration,
  chooseDuration,
  nextFollowUp,
  setNextFollowUp,
  saving,
  processCall,
  isArabic,
  currentCourse,
}: {
  lead: Lead;
  outcomes: typeof outcomes;
  outcome: Outcome;
  setOutcome: (value: Outcome) => void;
  courses: Course[];
  courseId: string;
  setCourseId: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  duration: number;
  chooseDuration: (minutes: number) => void;
  nextFollowUp: string;
  setNextFollowUp: (value: string) => void;
  saving: boolean;
  processCall: () => void;
  isArabic: boolean;
  currentCourse: string;
}) {
  const tx = (ar: string, en: string) => (isArabic ? ar : en);
  return (
    <div className="v8-toolbar p-4 md:p-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-600">{lead.customer_code ?? lead.id}</p>
              <h3 className="v8-heading mt-1 text-lg font-bold">{lead.full_name ?? tx("بدون اسم", "Unnamed")}</h3>
            </div>
            <div className="v8-muted text-xs">{tx("الدورة الحالية", "Current course")}: <span className="v8-heading font-semibold">{currentCourse}</span></div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {outcomeItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setOutcome(item.value)}
                className={`rounded border px-3 py-2.5 text-sm font-semibold ${outcome === item.value ? "v8-button-active" : "v8-button"}`}
              >
                {tx(item.ar, item.en)}
              </button>
            ))}
          </div>

          {outcome === "busy" ? (
            <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-center gap-2 font-semibold"><AlarmClock className="h-5 w-5" />{tx("حدد موعد الاتصال القادم", "Set next call time")}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[15, 30, 60, 120, 1440].map((minutes) => (
                  <button key={minutes} type="button" onClick={() => chooseDuration(minutes)} className={`rounded border px-3 py-2 text-sm ${duration === minutes ? "border-amber-600 bg-amber-200 text-amber-950" : "border-amber-300 bg-white text-amber-900"}`}>
                    {minutes === 1440 ? tx("غدًا", "Tomorrow") : `${minutes} ${tx("دقيقة", "min")}`}
                  </button>
                ))}
              </div>
              <input type="datetime-local" value={nextFollowUp} onChange={(event) => setNextFollowUp(event.target.value)} className="mt-3 w-full rounded border border-amber-300 bg-white px-3 py-2.5 text-sm text-slate-900" />
            </div>
          ) : null}
        </div>

        <div>
          <label className="block">
            <span className="v8-heading mb-2 block text-sm font-semibold">{tx("الدورة", "Course")}</span>
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="v8-input w-full rounded border px-3 py-2.5 text-sm">
              <option value="">{tx("بدون دورة", "No course")}</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{isArabic ? course.name_ar ?? course.name ?? course.name_en : course.name_en ?? course.name ?? course.name_ar}</option>)}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="v8-heading mb-2 block text-sm font-semibold">{tx("وصف نتيجة المكالمة", "Call result details")}</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} className="v8-input w-full resize-y rounded border px-3 py-3 text-sm" placeholder={tx("اكتب ملخص المكالمة والخطوة القادمة...", "Write call summary and next step...")} />
          </label>
          <button type="button" onClick={processCall} disabled={saving} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? tx("جاري الحفظ...", "Saving...") : tx("حفظ نتيجة المكالمة", "Save call result")}
          </button>
        </div>
      </div>
    </div>
  );
}
