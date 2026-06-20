"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  FileCheck2,
  Filter,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Send,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";

type RequestRow = {
  id: string;
  request_code: string | null;
  title: string;
  description: string | null;
  request_type: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  sender_id: string | null;
  receiver_id: string | null;
  owner_id: string | null;
  event_type: string | null;
  result_type: string | null;
  started_at: string | null;
  done_at: string | null;
  done_description: string | null;
  created_at: string;
  updated_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

type ActivityLog = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
};

type Tab = "assign" | "incoming" | "outgoing" | "team";
type DeadlineFilter = "all" | "today" | "tomorrow" | "week" | "month" | "overdue";

type Props = {
  initialRequests: RequestRow[];
  profiles: Profile[];
  currentUserId: string;
  currentUserName: string;
  role: string;
  initialTab: string;
};

const requestTypes = [
  { value: "complete_documents", ar: "استكمال مستندات", en: "Complete documents" },
  { value: "registration", ar: "تسجيل عميل", en: "Registration" },
  { value: "meeting", ar: "اجتماع", en: "Meeting" },
  { value: "call", ar: "مكالمة", en: "Call" },
  { value: "follow_up", ar: "متابعة", en: "Follow-up" },
  { value: "other", ar: "طلب آخر", en: "Other" },
] as const;

const priorities = [
  { value: "low", ar: "منخفضة", en: "Low" },
  { value: "medium", ar: "متوسطة", en: "Medium" },
  { value: "high", ar: "مرتفعة", en: "High" },
  { value: "urgent", ar: "عاجلة", en: "Urgent" },
] as const;

const statuses = [
  { value: "all", ar: "كل الحالات", en: "All statuses" },
  { value: "todo", ar: "جديد", en: "New" },
  { value: "in_progress", ar: "قيد التنفيذ", en: "In progress" },
  { value: "done", ar: "منتهي", en: "Done" },
  { value: "canceled", ar: "ملغي", en: "Canceled" },
] as const;

function defaultDueDate() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function roleGroup(role: string | null) {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
  if (role === "finance") return "finance";
  if (role === "data_analyst") return "data_analyst";
  return "sales";
}

function dateOnly(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isDone(status: string | null) {
  return ["done", "completed", "closed", "finished"].includes(status ?? "");
}

function isOverdue(row: RequestRow) {
  if (!row.due_date || isDone(row.status) || row.status === "canceled") return false;
  return new Date(row.due_date).getTime() < Date.now();
}

function rowTone(row: RequestRow) {
  if (isDone(row.status)) {
    if (row.done_at && row.due_date && new Date(row.done_at) > new Date(row.due_date)) {
      return "border-amber-300 bg-amber-50/80 dark:bg-amber-950/30";
    }
    return "border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30";
  }
  if (isOverdue(row)) return "border-red-300 bg-red-50/80 dark:bg-red-950/30";
  return "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40";
}

export function RequestsClient({
  initialRequests,
  profiles,
  currentUserId,
  currentUserName,
  role,
  initialTab,
}: Props) {
  const router = useRouter();
  const { language } = useI18n();
  const isArabic = language === "ar";
  const locale = isArabic ? "ar-EG" : "en-US";
  const canManageTeam = ["developer", "admin", "manager"].includes(role);
  const canCreate = role !== "data_analyst";

  const normalizeTab = (value: string): Tab => {
    if (value === "assign" || value === "outgoing" || value === "team") return value;
    return "incoming";
  };

  const [tab, setTab] = useState<Tab>(normalizeTab(initialTab));
  const [requests, setRequests] = useState<RequestRow[]>(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("all");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [resultType, setResultType] = useState("completed");
  const [doneDescription, setDoneDescription] = useState("");
  const [actionNote, setActionNote] = useState("");

  const [receiverId, setReceiverId] = useState(currentUserId);
  const [requestType, setRequestType] = useState("complete_documents");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [description, setDescription] = useState("");

  const tx = (ar: string, en: string) => (isArabic ? ar : en);

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles]
  );

  const groupedProfiles = useMemo(() => {
    const groups = new Map<string, Profile[]>();
    for (const profile of profiles) {
      const key = roleGroup(profile.role);
      groups.set(key, [...(groups.get(key) ?? []), profile]);
    }
    return groups;
  }, [profiles]);

  const tabRows = useMemo(() => {
    if (tab === "incoming") return requests.filter((row) => row.receiver_id === currentUserId);
    if (tab === "outgoing") return requests.filter((row) => row.sender_id === currentUserId);
    if (tab === "team" && canManageTeam) return requests;
    return [];
  }, [canManageTeam, currentUserId, requests, tab]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    return tabRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (typeFilter !== "all" && row.request_type !== typeFilter) return false;

      const due = dateOnly(row.due_date);
      if (deadlineFilter === "overdue" && !isOverdue(row)) return false;
      if (deadlineFilter !== "all" && deadlineFilter !== "overdue") {
        if (!due) return false;
        if (deadlineFilter === "today" && due.getTime() !== today.getTime()) return false;
        if (deadlineFilter === "tomorrow" && due.getTime() !== tomorrow.getTime()) return false;
        if (deadlineFilter === "week" && (due < today || due >= weekEnd)) return false;
        if (deadlineFilter === "month" && (due < today || due >= monthEnd)) return false;
      }

      if (!keyword) return true;
      const sender = profileMap.get(row.sender_id ?? "");
      const receiver = profileMap.get(row.receiver_id ?? "");
      return [
        row.request_code,
        row.title,
        row.description,
        sender?.full_name,
        sender?.email,
        receiver?.full_name,
        receiver?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [deadlineFilter, profileMap, search, statusFilter, tabRows, typeFilter]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const summary = useMemo(() => {
    const incoming = requests.filter((row) => row.receiver_id === currentUserId);
    const outgoing = requests.filter((row) => row.sender_id === currentUserId);
    return {
      incoming: incoming.length,
      outgoing: outgoing.length,
      pending: incoming.filter((row) => !isDone(row.status) && row.status !== "canceled").length,
      overdue: incoming.filter(isOverdue).length,
      done: incoming.filter((row) => isDone(row.status)).length,
    };
  }, [currentUserId, requests]);

  function personName(id: string | null) {
    if (!id) return tx("غير محدد", "Not set");
    const person = profileMap.get(id);
    return person?.full_name ?? person?.email ?? id;
  }

  function roleLabel(value: string) {
    const labels: Record<string, [string, string]> = {
      developer: ["مطور النظام", "Developer"],
      admin: ["المدير العام", "General manager"],
      manager: ["تيم ليدر سيلز", "Sales team leader"],
      moderator: ["الموديريتور", "Moderator"],
      marketer: ["المسوق", "Marketer"],
      sales: ["سيلز", "Sales"],
      finance: ["المالية والحسابات", "Finance"],
      data_analyst: ["محلل البيانات", "Data analyst"],
    };
    return tx(labels[value]?.[0] ?? value, labels[value]?.[1] ?? value);
  }

  function typeLabel(value: string | null) {
    const item = requestTypes.find((entry) => entry.value === value);
    return item ? tx(item.ar, item.en) : tx("طلب آخر", "Other");
  }

  function statusLabel(value: string | null) {
    const item = statuses.find((entry) => entry.value === value);
    return item ? tx(item.ar, item.en) : value ?? "-";
  }

  function resultLabel(value: string | null) {
    if (value === "completed") return tx("تم التنفيذ", "Completed");
    if (value === "rejected") return tx("مرفوض", "Rejected");
    if (value === "needs_information") return tx("يحتاج معلومات", "Needs information");
    if (value === "forwarded") return tx("تم التحويل", "Forwarded");
    return "-";
  }

  function formatDate(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
  }

  function switchTab(next: Tab) {
    setTab(next);
    setPage(1);
    setMessage("");
    setError("");
    router.replace(`/requests?tab=${next}`, { scroll: false });
  }

  function resetForm() {
    setReceiverId(currentUserId);
    setRequestType("complete_documents");
    setTitle("");
    setPriority("medium");
    setDueDate(defaultDueDate());
    setDescription("");
  }

  async function submitRequest() {
    setMessage("");
    setError("");

    if (!receiverId || !title.trim() || !description.trim() || !dueDate) {
      setError(tx("أكمل جميع الحقول المطلوبة.", "Complete all required fields."));
      return;
    }

    setSaving(true);
    const response = await fetch("/api/v1/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiver_id: receiverId,
        request_type: requestType,
        title,
        description,
        priority,
        due_date: new Date(dueDate).toISOString(),
      }),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result.message ?? tx("تعذر إرسال الطلب.", "Unable to send request."));
      return;
    }

    setRequests((current) => [result.data as RequestRow, ...current]);
    resetForm();
    setMessage(tx("تم إسناد الطلب وإضافته إلى التقويم.", "Request assigned and added to calendar."));
    switchTab("outgoing");
  }

  async function openDetails(row: RequestRow) {
    setSelected(row);
    setLogs([]);
    setDoneDescription("");
    setActionNote("");
    setResultType("completed");
    setLoadingDetails(true);

    const response = await fetch(`/api/v1/requests/${row.id}`, { cache: "no-store" });
    const result = await response.json();
    setLoadingDetails(false);

    if (response.ok) {
      setSelected(result.data as RequestRow);
      setLogs((result.logs ?? []) as ActivityLog[]);
    }
  }

  async function runAction(action: "start" | "complete" | "cancel" | "reopen") {
    if (!selected) return;
    setSaving(true);
    setError("");

    const response = await fetch(`/api/v1/requests/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        result_type: resultType,
        done_description: doneDescription,
        note: actionNote,
      }),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(tx("تعذر تنفيذ الإجراء على الطلب.", "Unable to update request."));
      return;
    }

    const updated = result.data as RequestRow;
    setRequests((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    setSelected(updated);
    setMessage(tx("تم تحديث الطلب بنجاح.", "Request updated successfully."));
    await openDetails(updated);
  }

  function exportCsv() {
    const headers = [
      "request_code",
      "sender",
      "receiver",
      "created_at",
      "deadline",
      "type",
      "description",
      "status",
      "result",
      "done_at",
      "done_description",
    ];
    const rows = filteredRows.map((row) => [
      row.request_code ?? "",
      personName(row.sender_id),
      personName(row.receiver_id),
      row.created_at,
      row.due_date ?? "",
      typeLabel(row.request_type),
      row.description ?? "",
      statusLabel(row.status),
      resultLabel(row.result_type),
      row.done_at ?? "",
      row.done_description ?? "",
    ]);
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `elitecrm-requests-${tab}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label={tx("الطلبات الواردة", "Incoming")} value={summary.incoming} icon={ArrowDownToLine} />
        <SummaryCard label={tx("الطلبات الصادرة", "Outgoing")} value={summary.outgoing} icon={ArrowUpFromLine} />
        <SummaryCard label={tx("قيد الانتظار", "Pending")} value={summary.pending} icon={Clock3} tone="blue" />
        <SummaryCard label={tx("متأخرة", "Overdue")} value={summary.overdue} icon={CalendarClock} tone="red" />
        <SummaryCard label={tx("مكتملة", "Completed")} value={summary.done} icon={CheckCircle2} tone="green" />
      </div>

      <section className="v8-card overflow-hidden rounded-md">
        <div className="flex flex-wrap border-b" style={{ borderColor: "var(--v8-border)" }}>
          {canCreate ? <TabButton active={tab === "assign"} onClick={() => switchTab("assign")} icon={Plus} label={tx("إسناد طلب", "Assign request")} /> : null}
          <TabButton active={tab === "incoming"} onClick={() => switchTab("incoming")} icon={ArrowDownToLine} label={tx("الطلبات الواردة", "Incoming requests")} count={summary.incoming} />
          <TabButton active={tab === "outgoing"} onClick={() => switchTab("outgoing")} icon={ArrowUpFromLine} label={tx("الطلبات الصادرة", "Outgoing requests")} count={summary.outgoing} />
          {canManageTeam ? <TabButton active={tab === "team"} onClick={() => switchTab("team")} icon={UsersRound} label={tx("طلبات الفريق", "Team requests")} count={requests.length} /> : null}
        </div>

        {tab === "assign" ? (
          <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,720px)_1fr]">
            <div>
              <div className="border-b pb-3" style={{ borderColor: "var(--v8-border)" }}>
                <h2 className="v8-heading text-xl font-semibold">{tx("إسناد طلب جديد", "Assign a new request")}</h2>
                <p className="v8-muted mt-1 text-sm">{tx("سيظهر الطلب للمستلم وفي التقويم والإشعارات.", "The request will appear for the receiver, calendar, and notifications.")}</p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label={tx("من", "From")}>
                  <div className="v8-toolbar flex items-center gap-2 rounded border px-3 py-2.5 text-sm"><UserRound className="h-4 w-4" />{currentUserName}</div>
                </Field>
                <Field label={tx("إلى", "To")} required>
                  <select value={receiverId} onChange={(event) => setReceiverId(event.target.value)} className="v8-input w-full rounded border px-3 py-2.5 text-sm">
                    {Array.from(groupedProfiles.entries()).map(([group, people]) => (
                      <optgroup key={group} label={roleLabel(group)}>
                        {people.map((person) => <option key={person.id} value={person.id}>{person.id === currentUserId ? tx("أنا", "Me") : person.full_name ?? person.email ?? person.id}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label={tx("نوع الطلب", "Request type")} required>
                  <select value={requestType} onChange={(event) => setRequestType(event.target.value)} className="v8-input w-full rounded border px-3 py-2.5 text-sm">
                    {requestTypes.map((item) => <option key={item.value} value={item.value}>{tx(item.ar, item.en)}</option>)}
                  </select>
                </Field>
                <Field label={tx("الأولوية", "Priority")} required>
                  <select value={priority} onChange={(event) => setPriority(event.target.value)} className="v8-input w-full rounded border px-3 py-2.5 text-sm">
                    {priorities.map((item) => <option key={item.value} value={item.value}>{tx(item.ar, item.en)}</option>)}
                  </select>
                </Field>
                <Field label={tx("عنوان الطلب", "Request title")} required className="md:col-span-2">
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={tx("مثال: استكمال مستندات تسجيل العميل", "Example: Complete customer registration documents")} className="v8-input w-full rounded border px-3 py-2.5 text-sm" />
                </Field>
                <Field label={tx("موعد التسليم", "Deadline")} required className="md:col-span-2">
                  <input type="datetime-local" value={dueDate} min={defaultDueDate().slice(0, 16)} onChange={(event) => setDueDate(event.target.value)} className="v8-input w-full rounded border px-3 py-2.5 text-sm" />
                </Field>
                <Field label={tx("وصف الطلب", "Description")} required className="md:col-span-2">
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder={tx("اكتب المطلوب بوضوح وأضف أي تفاصيل لازمة للتنفيذ...", "Write the request clearly and include all required details...")} className="v8-input w-full resize-y rounded border px-3 py-3 text-sm" />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderColor: "var(--v8-border)" }}>
                <button type="button" onClick={submitRequest} disabled={saving} className="inline-flex items-center gap-2 rounded bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {saving ? tx("جاري الإرسال...", "Sending...") : tx("إسناد الطلب", "Assign request")}
                </button>
                <button type="button" onClick={resetForm} className="v8-button rounded px-4 py-2.5 text-sm">{tx("إعادة ضبط", "Reset")}</button>
                {message ? <span className="text-sm text-emerald-600">{message}</span> : null}
                {error ? <span className="text-sm text-red-600">{error}</span> : null}
              </div>
            </div>

            <aside className="v8-toolbar h-fit rounded border p-4">
              <h3 className="v8-heading font-semibold">{tx("مسار الطلب", "Request workflow")}</h3>
              <div className="mt-4 space-y-3 text-sm">
                <Step number="1" text={tx("إسناد الطلب للمستخدم المحدد", "Assign to the selected user")} />
                <Step number="2" text={tx("يصل إشعار ويظهر في التقويم", "Notification and calendar event are created")} />
                <Step number="3" text={tx("يبدأ المستلم التنفيذ ثم يسجل النتيجة", "Receiver starts work and records the result")} />
                <Step number="4" text={tx("يظهر وقت الإنجاز وهل تم في الموعد", "Completion time and deadline performance are recorded")} />
              </div>
            </aside>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid gap-2 lg:grid-cols-[1fr_180px_190px_190px_auto]">
              <label className="relative block">
                <Search className="v8-muted absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={tx("بحث بالكود أو العنوان أو الموظف", "Search code, title, or employee")} className="v8-input w-full rounded border py-2.5 pe-3 ps-9 text-sm" />
              </label>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="v8-input rounded border px-3 py-2.5 text-sm">
                {statuses.map((item) => <option key={item.value} value={item.value}>{tx(item.ar, item.en)}</option>)}
              </select>
              <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }} className="v8-input rounded border px-3 py-2.5 text-sm">
                <option value="all">{tx("كل الأنواع", "All types")}</option>
                {requestTypes.map((item) => <option key={item.value} value={item.value}>{tx(item.ar, item.en)}</option>)}
              </select>
              <select value={deadlineFilter} onChange={(event) => { setDeadlineFilter(event.target.value as DeadlineFilter); setPage(1); }} className="v8-input rounded border px-3 py-2.5 text-sm">
                <option value="all">{tx("كل المواعيد", "All deadlines")}</option>
                <option value="today">{tx("اليوم", "Today")}</option>
                <option value="tomorrow">{tx("غدًا", "Tomorrow")}</option>
                <option value="week">{tx("هذا الأسبوع", "This week")}</option>
                <option value="month">{tx("هذا الشهر", "This month")}</option>
                <option value="overdue">{tx("المتأخر", "Overdue")}</option>
              </select>
              <button type="button" onClick={exportCsv} className="v8-button inline-flex items-center justify-center gap-2 rounded px-3 py-2.5 text-sm"><ArrowDownToLine className="h-4 w-4" />{tx("تصدير", "Export")}</button>
            </div>

            <div className="mt-4 overflow-x-auto rounded border" style={{ borderColor: "var(--v8-border)" }}>
              <table className="min-w-[1300px] w-full border-collapse text-sm">
                <thead className="v8-toolbar text-xs">
                  <tr>
                    <Th>{tx("الكود", "Code")}</Th>
                    <Th>{tx("المرسل", "Sender")}</Th>
                    <Th>{tx("المستلم", "Receiver")}</Th>
                    <Th>{tx("تاريخ الإنشاء", "Created")}</Th>
                    <Th>{tx("موعد التسليم", "Deadline")}</Th>
                    <Th>{tx("النوع", "Type")}</Th>
                    <Th>{tx("الوصف", "Description")}</Th>
                    <Th>{tx("الحالة", "Status")}</Th>
                    <Th>{tx("النتيجة", "Result")}</Th>
                    <Th>{tx("تم في", "Done at")}</Th>
                    <Th>{tx("الإجراء", "Action")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id} className={`border-t align-top ${rowTone(row)}`} style={{ borderColor: "var(--v8-border)" }}>
                      <Td><span className="font-mono text-xs font-bold">{row.request_code ?? row.id.slice(0, 8)}</span></Td>
                      <Td>{personName(row.sender_id)}</Td>
                      <Td>{personName(row.receiver_id)}</Td>
                      <Td>{formatDate(row.created_at)}</Td>
                      <Td><span className={isOverdue(row) ? "font-bold text-red-600" : ""}>{formatDate(row.due_date)}</span></Td>
                      <Td>{typeLabel(row.request_type)}</Td>
                      <Td><div className="max-w-72"><p className="v8-heading truncate font-semibold">{row.title}</p><p className="v8-muted mt-1 line-clamp-2 text-xs">{row.description}</p></div></Td>
                      <Td><StatusBadge status={row.status} label={statusLabel(row.status)} /></Td>
                      <Td>{resultLabel(row.result_type)}</Td>
                      <Td>{formatDate(row.done_at)}</Td>
                      <Td><button type="button" onClick={() => openDetails(row)} className="inline-flex items-center gap-1 rounded bg-[#29455f] px-3 py-2 text-xs font-semibold text-white"><Eye className="h-3.5 w-3.5" />{tx("عرض", "View")}</button></Td>
                    </tr>
                  ))}
                  {!pagedRows.length ? <tr><td colSpan={11}><div className="v8-muted py-16 text-center">{tx("لا توجد طلبات مطابقة", "No matching requests")}</div></td></tr> : null}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="v8-muted">{tx(`عرض ${pagedRows.length} من ${filteredRows.length}`, `Showing ${pagedRows.length} of ${filteredRows.length}`)}</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="v8-button rounded p-2 disabled:opacity-40">{isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
                <span className="v8-heading min-w-20 text-center font-semibold">{safePage} / {totalPages}</span>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="v8-button rounded p-2 disabled:opacity-40">{isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <div className="v8-card max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b p-4" style={{ borderColor: "var(--v8-border)", background: "var(--v8-panel)" }}>
              <div>
                <p className="text-xs font-bold text-emerald-600">{selected.request_code ?? selected.id}</p>
                <h2 className="v8-heading mt-1 text-xl font-bold">{selected.title}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="v8-button rounded p-2"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-5 p-4 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label={tx("المرسل", "Sender")} value={personName(selected.sender_id)} />
                  <Detail label={tx("المستلم", "Receiver")} value={personName(selected.receiver_id)} />
                  <Detail label={tx("النوع", "Type")} value={typeLabel(selected.request_type)} />
                  <Detail label={tx("الحالة", "Status")} value={statusLabel(selected.status)} />
                  <Detail label={tx("موعد التسليم", "Deadline")} value={formatDate(selected.due_date)} />
                  <Detail label={tx("وقت الإنجاز", "Done at")} value={formatDate(selected.done_at)} />
                </div>

                <div className="v8-toolbar rounded border p-4">
                  <p className="v8-muted text-xs">{tx("الوصف", "Description")}</p>
                  <p className="v8-heading mt-2 whitespace-pre-wrap text-sm leading-7">{selected.description || "-"}</p>
                </div>

                {selected.done_description ? <div className="rounded border border-emerald-300 bg-emerald-50 p-4 dark:bg-emerald-950/30"><p className="text-xs text-emerald-700">{tx("وصف التنفيذ", "Completion details")}</p><p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900 dark:text-emerald-100">{selected.done_description}</p></div> : null}

                {!isDone(selected.status) && selected.status !== "canceled" && (selected.receiver_id === currentUserId || canManageTeam) ? (
                  <div className="rounded border border-sky-200 bg-sky-50 p-4 dark:bg-sky-950/30">
                    <h3 className="font-semibold text-sky-900 dark:text-sky-100">{tx("تنفيذ الطلب", "Complete request")}</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <select value={resultType} onChange={(event) => setResultType(event.target.value)} className="rounded border border-sky-200 bg-white px-3 py-2.5 text-sm dark:bg-slate-900">
                        <option value="completed">{tx("تم التنفيذ", "Completed")}</option>
                        <option value="needs_information">{tx("يحتاج معلومات", "Needs information")}</option>
                        <option value="forwarded">{tx("تم التحويل", "Forwarded")}</option>
                        <option value="rejected">{tx("مرفوض", "Rejected")}</option>
                      </select>
                      <button type="button" onClick={() => runAction("start")} disabled={saving || selected.status === "in_progress"} className="v8-button inline-flex items-center justify-center gap-2 rounded px-3 py-2.5 text-sm disabled:opacity-50"><Clock3 className="h-4 w-4" />{tx("بدء التنفيذ", "Start work")}</button>
                    </div>
                    <textarea value={doneDescription} onChange={(event) => setDoneDescription(event.target.value)} rows={4} placeholder={tx("اكتب نتيجة التنفيذ بالتفصيل...", "Describe the completion result...")} className="mt-3 w-full rounded border border-sky-200 bg-white px-3 py-3 text-sm dark:bg-slate-900" />
                    <button type="button" onClick={() => runAction("complete")} disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}{tx("إنهاء الطلب", "Complete request")}</button>
                  </div>
                ) : null}

                {(selected.sender_id === currentUserId || canManageTeam) ? (
                  <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "var(--v8-border)" }}>
                    {isDone(selected.status) || selected.status === "canceled" ? <button type="button" onClick={() => runAction("reopen")} disabled={saving} className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" />{tx("إعادة فتح", "Reopen")}</button> : <button type="button" onClick={() => runAction("cancel")} disabled={saving} className="rounded border border-red-300 px-3 py-2 text-sm text-red-600">{tx("إلغاء الطلب", "Cancel request")}</button>}
                    <input value={actionNote} onChange={(event) => setActionNote(event.target.value)} placeholder={tx("ملاحظة الإجراء", "Action note")} className="v8-input min-w-64 flex-1 rounded border px-3 py-2 text-sm" />
                  </div>
                ) : null}
              </div>

              <aside>
                <h3 className="v8-heading flex items-center gap-2 font-semibold"><FileCheck2 className="h-4 w-4" />{tx("سجل الطلب", "Request timeline")}</h3>
                <div className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:start-[7px] before:top-2 before:w-px before:bg-slate-200">
                  {loadingDetails ? <div className="v8-muted flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />{tx("جاري التحميل...", "Loading...")}</div> : null}
                  {logs.map((log) => <div key={log.id} className="relative ps-7"><span className="absolute start-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-400 bg-white" /><p className="v8-heading text-sm font-semibold">{log.actor_name ?? tx("النظام", "System")}</p><p className="v8-muted mt-1 text-xs">{log.action} · {formatDate(log.created_at)}</p>{log.note ? <p className="v8-muted mt-1 text-xs leading-5">{log.note}</p> : null}</div>)}
                  {!loadingDetails && !logs.length ? <p className="v8-muted text-sm">{tx("لا توجد تحديثات مسجلة", "No recorded updates")}</p> : null}
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone = "default" }: { label: string; value: number; icon: typeof Send; tone?: "default" | "red" | "blue" | "green" }) {
  const toneClass = tone === "red" ? "text-red-600" : tone === "blue" ? "text-sky-600" : tone === "green" ? "text-emerald-600" : "v8-heading";
  return <div className="v8-card rounded-md p-4"><div className="flex items-center justify-between gap-3"><div><p className="v8-muted text-xs">{label}</p><p className={`mt-2 text-3xl font-bold ${toneClass}`}>{value}</p></div><span className={`rounded bg-slate-100 p-2 ${toneClass}`}><Icon className="h-5 w-5" /></span></div></div>;
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof Send; label: string; count?: number }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-emerald-500 text-emerald-600" : "border-transparent v8-muted"}`}><Icon className="h-4 w-4" />{label}{typeof count === "number" ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{count}</span> : null}</button>;
}

function Field({ label, required, className = "", children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="v8-heading mb-2 block text-sm font-semibold">{label}{required ? <span className="ms-1 text-red-500">*</span> : null}</span>{children}</label>;
}

function Step({ number, text }: { number: string; text: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#29455f] text-xs font-bold text-white">{number}</span><p className="v8-muted pt-1 leading-6">{text}</p></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-3 text-start font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3">{children}</td>;
}

function StatusBadge({ status, label }: { status: string | null; label: string }) {
  const classes = status === "done" ? "bg-emerald-100 text-emerald-700" : status === "in_progress" ? "bg-sky-100 text-sky-700" : status === "canceled" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="v8-toolbar rounded border p-3"><p className="v8-muted text-xs">{label}</p><p className="v8-heading mt-1 text-sm font-semibold">{value}</p></div>;
}
