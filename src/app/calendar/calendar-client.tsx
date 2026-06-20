"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  List,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";

type LeadEvent = {
  id: string;
  customer_code: string | null;
  full_name: string | null;
  phone: string | null;
  owner_id: string | null;
  company_id?: string | null;
  status: string | null;
  customer_status: string | null;
  program: string | null;
  next_follow_up_at: string | null;
};

type TaskEvent = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  owner_id: string | null;
  related_type: string | null;
  related_id: string | null;
  event_type?: string | null;
  all_day?: boolean | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

type EventKind = "call" | "meeting" | "task";
type EventSource = "lead" | "task";
type ViewMode = "month" | "week" | "day" | "list";
type FilterKey =
  | "finished"
  | "calls"
  | "meetings"
  | "tasks";

type CalendarEvent = {
  id: string;
  source: EventSource;
  sourceId: string;
  kind: EventKind;
  start: string;
  date: string;
  title: string;
  description: string;
  subtitle: string;
  completed: boolean;
  overdue: boolean;
  ownerId: string | null;
  leadId: string | null;
  customerCode: string | null;
  priority: string;
  allDay: boolean;
  status: string;
};

type EventForm = {
  eventType: EventKind;
  title: string;
  description: string;
  dueDate: string;
  ownerId: string;
  leadId: string;
  priority: string;
  allDay: boolean;
};

type Props = {
  leads: LeadEvent[];
  tasks: TaskEvent[];
  profiles: Profile[];
  currentUserId: string;
  role: string;
};

const filterStorageKey =
  "elitecrm-calendar-v83-filters";
const viewStorageKey =
  "elitecrm-calendar-v83-view";

const completedStatuses = new Set([
  "paid",
  "completed",
  "done",
  "closed",
  "finished",
  "not_interested",
  "wrong_number",
  "canceled",
]);

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateTime(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

function dateAt(date: Date, hour = 10) {
  const result = new Date(date);
  result.setHours(hour, 0, 0, 0);
  return localDateTime(result);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function isCompleted(status: string | null) {
  return completedStatuses.has(
    (status ?? "").toLowerCase()
  );
}

function inferEventType(task: TaskEvent): EventKind {
  if (
    task.event_type === "call" ||
    task.event_type === "meeting" ||
    task.event_type === "task"
  ) {
    return task.event_type;
  }

  const text = `${task.title ?? ""} ${
    task.description ?? ""
  }`.toLowerCase();

  if (
    text.includes("meeting") ||
    text.includes("meet") ||
    text.includes("اجتماع") ||
    text.includes("مقابلة")
  ) {
    return "meeting";
  }

  if (
    text.includes("call") ||
    text.includes("phone") ||
    text.includes("اتصال") ||
    text.includes("مكالمة")
  ) {
    return "call";
  }

  return "task";
}

function formatDateTime(
  value: string,
  locale: string
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPastDate(date: Date) {
  const target = new Date(date);
  target.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target < today;
}

function defaultForm(
  date: Date,
  currentUserId: string
): EventForm {
  return {
    eventType: "call",
    title: "",
    description: "",
    dueDate: dateAt(date),
    ownerId: currentUserId,
    leadId: "",
    priority: "medium",
    allDay: false,
  };
}

export function CalendarClient({
  leads,
  tasks,
  profiles,
  currentUserId,
  role,
}: Props) {
  const router = useRouter();
  const { language } = useI18n();
  const isArabic = language === "ar";
  const locale = isArabic ? "ar-EG" : "en-US";
  const canAssign = [
    "developer",
    "admin",
    "manager",
    "moderator",
  ].includes(role);

  const [cursor, setCursor] = useState(
    () => new Date()
  );
  const [selected, setSelected] = useState(
    () => dateKey(new Date())
  );
  const [viewMode, setViewMode] =
    useState<ViewMode>("month");
  const [filters, setFilters] = useState<
    Record<FilterKey, boolean>
  >({
    finished: true,
    calls: true,
    meetings: true,
    tasks: true,
  });
  const [ownerFilter, setOwnerFilter] = useState(
    role === "sales" ? currentUserId : "all"
  );
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] =
    useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);
  const [activeEvent, setActiveEvent] =
    useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventForm>(
    () => defaultForm(new Date(), currentUserId)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const tx = (ar: string, en: string) =>
    isArabic ? ar : en;

  useEffect(() => {
    try {
      const savedFilters = window.localStorage.getItem(
        filterStorageKey
      );
      const savedView = window.localStorage.getItem(
        viewStorageKey
      );

      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        setFilters((current) => ({
          ...current,
          ...parsed,
        }));
      }

      if (
        savedView === "month" ||
        savedView === "week" ||
        savedView === "day" ||
        savedView === "list"
      ) {
        setViewMode(savedView);
      }
    } catch {
      // Ignore invalid local preferences.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      filterStorageKey,
      JSON.stringify(filters)
    );
  }, [filters]);

  useEffect(() => {
    window.localStorage.setItem(
      viewStorageKey,
      viewMode
    );
  }, [viewMode]);

  const allEvents = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    const now = Date.now();

    for (const lead of leads) {
      if (!lead.next_follow_up_at) continue;

      const status =
        lead.customer_status ?? lead.status ?? "";

      result.push({
        id: `lead-${lead.id}`,
        source: "lead",
        sourceId: lead.id,
        kind: "call",
        start: lead.next_follow_up_at,
        date: lead.next_follow_up_at.slice(0, 10),
        title:
          lead.full_name ??
          tx("عميل بدون اسم", "Unnamed customer"),
        description: tx(
          "متابعة اتصال مع العميل",
          "Customer call follow-up"
        ),
        subtitle: [lead.phone, lead.program]
          .filter(Boolean)
          .join(" • "),
        completed: isCompleted(status),
        overdue:
          !isCompleted(status) &&
          new Date(lead.next_follow_up_at).getTime() <
            now,
        ownerId: lead.owner_id,
        leadId: lead.id,
        customerCode: lead.customer_code,
        priority: "high",
        allDay: false,
        status,
      });
    }

    for (const task of tasks) {
      if (!task.due_date) continue;

      const kind = inferEventType(task);
      const completed = isCompleted(task.status);

      result.push({
        id: `task-${task.id}`,
        source: "task",
        sourceId: task.id,
        kind,
        start: task.due_date,
        date: task.due_date.slice(0, 10),
        title:
          task.title ??
          tx("حدث بدون عنوان", "Untitled event"),
        description: task.description ?? "",
        subtitle: task.description ?? "",
        completed,
        overdue:
          !completed &&
          new Date(task.due_date).getTime() < now,
        ownerId: task.owner_id,
        leadId:
          task.related_type === "lead"
            ? task.related_id
            : null,
        customerCode: null,
        priority: task.priority ?? "medium",
        allDay: Boolean(task.all_day),
        status: task.status ?? "todo",
      });
    }

    return result.sort(
      (a, b) =>
        new Date(a.start).getTime() -
        new Date(b.start).getTime()
    );
  }, [isArabic, leads, tasks]);

  const visibleEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allEvents.filter((event) => {
      if (!filters.finished && event.completed) {
        return false;
      }

      if (
        event.kind === "call" &&
        !filters.calls
      ) {
        return false;
      }

      if (
        event.kind === "meeting" &&
        !filters.meetings
      ) {
        return false;
      }

      if (
        event.kind === "task" &&
        !filters.tasks
      ) {
        return false;
      }

      if (
        ownerFilter !== "all" &&
        event.ownerId !== ownerFilter
      ) {
        return false;
      }

      if (!keyword) return true;

      return [
        event.title,
        event.description,
        event.subtitle,
        event.customerCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [
    allEvents,
    filters,
    ownerFilter,
    search,
  ]);

  const today = new Date();
  const todayKey = dateKey(today);
  const selectedDate = new Date(
    `${selected}T12:00:00`
  );
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthCells = useMemo(() => {
    const start = new Date(year, month, 1);
    start.setDate(1 - start.getDay());

    return Array.from(
      { length: 42 },
      (_, index) => addDays(start, index)
    );
  }, [year, month]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from(
      { length: 7 },
      (_, index) => addDays(start, index)
    );
  }, [selected]);

  const selectedEvents = visibleEvents.filter(
    (event) => event.date === selected
  );

  const upcomingEvents = visibleEvents
    .filter((event) => event.date >= todayKey)
    .slice(0, 150);

  const filteredMonthEvents = visibleEvents.filter(
    (event) => {
      const eventDate = new Date(
        `${event.date}T12:00:00`
      );
      return (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() === month
      );
    }
  );

  const stats = {
    month: filteredMonthEvents.length,
    today: visibleEvents.filter(
      (event) => event.date === todayKey
    ).length,
    overdue: visibleEvents.filter(
      (event) => event.overdue
    ).length,
    calls: filteredMonthEvents.filter(
      (event) => event.kind === "call"
    ).length,
    meetings: filteredMonthEvents.filter(
      (event) => event.kind === "meeting"
    ).length,
    tasks: filteredMonthEvents.filter(
      (event) => event.kind === "task"
    ).length,
  };

  const weekdays = isArabic
    ? [
        "الأحد",
        "الاثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت",
      ]
    : [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ];

  const title = (() => {
    if (viewMode === "day") {
      return selectedDate.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (viewMode === "week") {
      const first = weekDays[0];
      const last = weekDays[6];

      return `${first.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
      })} - ${last.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }

    return cursor.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    });
  })();

  const filterItems: Array<{
    key: FilterKey;
    ar: string;
    en: string;
  }> = [
    {
      key: "finished",
      ar: "إظهار المنتهي",
      en: "Show finished",
    },
    {
      key: "calls",
      ar: "إظهار المكالمات",
      en: "Show calls",
    },
    {
      key: "meetings",
      ar: "إظهار الاجتماعات",
      en: "Show meetings",
    },
    {
      key: "tasks",
      ar: "إظهار المهام",
      en: "Show tasks",
    },
  ];

  function ownerName(ownerId: string | null) {
    if (!ownerId) {
      return tx("غير مسند", "Unassigned");
    }

    const profile = profiles.find(
      (item) => item.id === ownerId
    );

    return (
      profile?.full_name ??
      profile?.email ??
      tx("مستخدم غير معروف", "Unknown user")
    );
  }

  function leadName(leadId: string | null) {
    if (!leadId) return "";
    const lead = leads.find(
      (item) => item.id === leadId
    );
    return lead?.full_name ?? "";
  }

  function navigate(offset: number) {
    if (viewMode === "month" || viewMode === "list") {
      const next = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + offset,
        1
      );
      setCursor(next);
      setSelected(dateKey(next));
      return;
    }

    const amount =
      viewMode === "week" ? offset * 7 : offset;
    const next = addDays(selectedDate, amount);
    setSelected(dateKey(next));
    setCursor(next);
  }

  function goToday() {
    const now = new Date();
    setCursor(now);
    setSelected(dateKey(now));
  }

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(
      () => setRefreshing(false),
      700
    );
  }

  function setView(nextView: ViewMode) {
    setViewMode(nextView);
    if (nextView === "month") {
      setCursor(selectedDate);
    }
  }

  function openCreate(date: Date) {
    if (isPastDate(date)) {
      setError(
        tx(
          "لا يمكن إنشاء حدث جديد في تاريخ سابق.",
          "You cannot create a new event in a past date."
        )
      );
      return;
    }

    setSelected(dateKey(date));
    setCursor(date);
    setActiveEvent(null);
    setForm(defaultForm(date, currentUserId));
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function openEvent(event: CalendarEvent) {
    setActiveEvent(event);
    setSelected(event.date);
    setCursor(new Date(event.start));
    setMessage("");
    setError("");

    setForm({
      eventType: event.kind,
      title: event.title,
      description: event.description,
      dueDate: localDateTime(
        new Date(event.start)
      ),
      ownerId:
        event.ownerId ?? currentUserId,
      leadId: event.leadId ?? "",
      priority: event.priority,
      allDay: event.allDay,
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setActiveEvent(null);
    setMessage("");
    setError("");
  }

  async function callApi(
    payload: Record<string, unknown>
  ) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/v1/calendar/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            tx(
              "تعذر تنفيذ العملية.",
              "Unable to complete the operation."
            )
        );
        return false;
      }

      setMessage(
        result.message ??
          tx(
            "تم حفظ التغييرات.",
            "Changes saved."
          )
      );

      router.refresh();

      window.setTimeout(() => {
        setModalOpen(false);
        setActiveEvent(null);
      }, 350);

      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : tx(
              "تعذر الاتصال بالخادم.",
              "Unable to connect to the server."
            )
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveEvent() {
    if (
      !form.title.trim() ||
      !form.dueDate
    ) {
      setError(
        tx(
          "أكمل عنوان الحدث والتاريخ.",
          "Complete the event title and date."
        )
      );
      return;
    }

    if (activeEvent?.source === "lead") {
      await callApi({
        action: "update_follow_up",
        lead_id: activeEvent.leadId,
        due_date: new Date(
          form.dueDate
        ).toISOString(),
        description: form.description,
      });
      return;
    }

    await callApi({
      action: activeEvent ? "update" : "create",
      task_id:
        activeEvent?.source === "task"
          ? activeEvent.sourceId
          : null,
      title: form.title,
      description: form.description,
      event_type: form.eventType,
      due_date: new Date(
        form.dueDate
      ).toISOString(),
      owner_id: form.ownerId,
      lead_id: form.leadId || null,
      priority: form.priority,
      all_day: form.allDay,
    });
  }

  async function completeEvent() {
    if (!activeEvent) return;

    await callApi(
      activeEvent.source === "lead"
        ? {
            action: "complete_follow_up",
            lead_id: activeEvent.leadId,
            description: form.description,
          }
        : {
            action: "complete",
            task_id: activeEvent.sourceId,
          }
    );
  }

  async function deleteEvent() {
    if (
      !activeEvent ||
      activeEvent.source !== "task"
    ) {
      return;
    }

    if (
      !window.confirm(
        tx(
          "هل تريد حذف هذا الحدث نهائيًا؟",
          "Delete this event permanently?"
        )
      )
    ) {
      return;
    }

    await callApi({
      action: "delete",
      task_id: activeEvent.sourceId,
    });
  }

  return (
    <div className="space-y-4">
      <section className="v8-card rounded-md p-4">
        <div
          className="flex flex-col gap-4 border-b pb-4 xl:flex-row xl:items-center xl:justify-between"
          style={{
            borderColor: "var(--v8-border)",
          }}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600">
              {tx(
                "مركز المتابعات والمواعيد",
                "Follow-up and scheduling center"
              )}
            </p>
            <h2 className="v8-heading mt-1 text-2xl font-bold">
              {tx(
                "التقويم التشغيلي",
                "Operations calendar"
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {filterItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    [item.key]:
                      !current[item.key],
                  }))
                }
                className="v8-muted inline-flex items-center gap-2 text-sm"
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded ${
                    filters[item.key]
                      ? "bg-emerald-500 text-white"
                      : "border"
                  }`}
                  style={
                    filters[item.key]
                      ? undefined
                      : {
                          borderColor:
                            "var(--v8-border)",
                        }
                  }
                >
                  {filters[item.key] ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : null}
                </span>
                {tx(item.ar, item.en)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <Search className="v8-muted absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={tx(
                "بحث باسم العميل أو الحدث أو الكود",
                "Search customer, event, or code"
              )}
              className="w-full rounded border px-9 py-2.5 text-sm outline-none"
              style={{
                borderColor: "var(--v8-border)",
                background:
                  "var(--v8-panel-muted)",
              }}
            />
          </label>

          <select
            value={ownerFilter}
            onChange={(event) =>
              setOwnerFilter(event.target.value)
            }
            disabled={role === "sales"}
            className="rounded border px-3 py-2.5 text-sm disabled:opacity-60"
            style={{
              borderColor: "var(--v8-border)",
              background:
                "var(--v8-panel-muted)",
            }}
          >
            <option value="all">
              {tx(
                "كل المستخدمين",
                "All users"
              )}
            </option>
            {profiles.map((profile) => (
              <option
                key={profile.id}
                value={profile.id}
              >
                {profile.full_name ??
                  profile.email ??
                  profile.id}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              openCreate(
                new Date(
                  `${selected}T12:00:00`
                )
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            {tx("حدث جديد", "New event")}
          </button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <CalendarStat
          label={tx(
            "أحداث الشهر",
            "Month events"
          )}
          value={stats.month}
          icon={CalendarCheck2}
        />
        <CalendarStat
          label={tx(
            "أحداث اليوم",
            "Today events"
          )}
          value={stats.today}
          icon={Clock3}
          tone="blue"
        />
        <CalendarStat
          label={tx("متأخر", "Overdue")}
          value={stats.overdue}
          icon={AlarmClock}
          tone="red"
        />
        <CalendarStat
          label={tx("مكالمات", "Calls")}
          value={stats.calls}
          icon={Phone}
          tone="amber"
        />
        <CalendarStat
          label={tx("اجتماعات", "Meetings")}
          value={stats.meetings}
          icon={UsersRound}
          tone="green"
        />
        <CalendarStat
          label={tx("مهام", "Tasks")}
          value={stats.tasks}
          icon={CheckCircle2}
        />
      </div>

      <section className="v8-card rounded-md p-3 md:p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="v8-button rounded px-3 py-2"
              aria-label={tx(
                "السابق",
                "Previous"
              )}
            >
              {isArabic ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(1)}
              className="v8-button rounded px-3 py-2"
              aria-label={tx(
                "التالي",
                "Next"
              )}
            >
              {isArabic ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={goToday}
              className="v8-button rounded px-3 py-2 text-sm"
            >
              {tx("اليوم", "Today")}
            </button>

            <button
              type="button"
              onClick={refresh}
              className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-sm"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              {tx("تحديث", "Refresh")}
            </button>
          </div>

          <h3 className="v8-heading text-center text-2xl font-semibold">
            {title}
          </h3>

          <div className="flex justify-start gap-1 xl:justify-end">
            {(
              [
                [
                  "month",
                  tx("شهر", "Month"),
                ],
                [
                  "week",
                  tx("أسبوع", "Week"),
                ],
                ["day", tx("يوم", "Day")],
                [
                  "list",
                  tx("قائمة", "List"),
                ],
              ] as Array<[ViewMode, string]>
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded px-3 py-2 text-sm ${
                  viewMode === mode
                    ? "v8-button-active"
                    : "v8-button"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {viewMode === "month" ? (
          <MonthView
            cells={monthCells}
            currentMonth={month}
            selected={selected}
            todayKey={todayKey}
            events={visibleEvents}
            weekdays={weekdays}
            locale={locale}
            openCreate={openCreate}
            openEvent={openEvent}
            setSelected={setSelected}
          />
        ) : null}

        {viewMode === "week" ? (
          <WeekView
            days={weekDays}
            events={visibleEvents}
            selected={selected}
            locale={locale}
            tx={tx}
            openCreate={openCreate}
            openEvent={openEvent}
            setSelected={setSelected}
          />
        ) : null}

        {viewMode === "day" ? (
          <DayView
            date={selectedDate}
            events={selectedEvents}
            locale={locale}
            tx={tx}
            openCreate={openCreate}
            openEvent={openEvent}
          />
        ) : null}

        {viewMode === "list" ? (
          <ListView
            events={upcomingEvents}
            locale={locale}
            tx={tx}
            openEvent={openEvent}
          />
        ) : null}
      </section>

      {modalOpen ? (
        <EventModal
          tx={tx}
          isArabic={isArabic}
          activeEvent={activeEvent}
          form={form}
          setForm={setForm}
          leads={leads}
          profiles={profiles}
          canAssign={canAssign}
          ownerName={ownerName}
          leadName={leadName}
          saving={saving}
          message={message}
          error={error}
          close={closeModal}
          save={saveEvent}
          complete={completeEvent}
          remove={deleteEvent}
        />
      ) : null}
    </div>
  );
}

function MonthView({
  cells,
  currentMonth,
  selected,
  todayKey,
  events,
  weekdays,
  locale,
  openCreate,
  openEvent,
  setSelected,
}: {
  cells: Date[];
  currentMonth: number;
  selected: string;
  todayKey: string;
  events: CalendarEvent[];
  weekdays: string[];
  locale: string;
  openCreate: (date: Date) => void;
  openEvent: (event: CalendarEvent) => void;
  setSelected: (value: string) => void;
}) {
  return (
    <div
      className="v8-calendar-grid mt-4 grid grid-cols-7 overflow-hidden border"
      dir="ltr"
    >
      {weekdays.map((day) => (
        <div
          key={day}
          className="v8-calendar-head border-b border-e p-2 text-center text-xs font-semibold"
        >
          {day}
        </div>
      ))}

      {cells.map((date) => {
        const key = dateKey(date);
        const dayEvents = events.filter(
          (event) => event.date === key
        );
        const outside =
          date.getMonth() !== currentMonth;
        const selectedClass =
          selected === key
            ? "v8-calendar-cell-selected"
            : "";
        const todayClass =
          todayKey === key
            ? "v8-calendar-cell-today"
            : "";

        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelected(key);
              openCreate(date);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                openCreate(date);
              }
            }}
            className={`v8-calendar-cell min-h-32 cursor-pointer border-b border-e p-2 text-start align-top transition hover:bg-slate-50 ${selectedClass} ${todayClass} ${
              outside ? "opacity-45" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="v8-heading text-sm font-semibold">
                {date.getDate()}
              </span>
              {dayEvents.length ? (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {dayEvents.length}
                </span>
              ) : null}
            </div>

            <div className="mt-2 space-y-1">
              {dayEvents
                .slice(0, 4)
                .map((calendarEvent) => (
                  <EventPill
                    key={calendarEvent.id}
                    event={calendarEvent}
                    locale={locale}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      openEvent(calendarEvent);
                    }}
                  />
                ))}

              {dayEvents.length > 4 ? (
                <div className="v8-muted text-[10px]">
                  +{dayEvents.length - 4}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekView({
  days,
  events,
  selected,
  locale,
  tx,
  openCreate,
  openEvent,
  setSelected,
}: {
  days: Date[];
  events: CalendarEvent[];
  selected: string;
  locale: string;
  tx: (ar: string, en: string) => string;
  openCreate: (date: Date) => void;
  openEvent: (event: CalendarEvent) => void;
  setSelected: (value: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {days.map((date) => {
        const key = dateKey(date);
        const dayEvents = events.filter(
          (event) => event.date === key
        );

        return (
          <div
            key={key}
            className={`v8-card min-h-56 rounded p-3 ${
              selected === key
                ? "v8-calendar-cell-selected"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setSelected(key);
                openCreate(date);
              }}
              className="w-full text-start"
            >
              <p className="v8-muted text-xs">
                {date.toLocaleDateString(locale, {
                  weekday: "long",
                })}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="v8-heading text-lg font-semibold">
                  {date.toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <Plus className="v8-muted h-4 w-4" />
              </div>
            </button>

            <div className="mt-3 space-y-2">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  onClick={() => openEvent(event)}
                />
              ))}

              {!dayEvents.length ? (
                <p className="v8-muted py-6 text-center text-xs">
                  {tx(
                    "لا توجد أحداث",
                    "No events"
                  )}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  date,
  events,
  locale,
  tx,
  openCreate,
  openEvent,
}: {
  date: Date;
  events: CalendarEvent[];
  locale: string;
  tx: (ar: string, en: string) => string;
  openCreate: (date: Date) => void;
  openEvent: (event: CalendarEvent) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-[180px_1fr]">
      <section className="v8-card rounded-md p-4 text-center">
        <p className="v8-muted text-sm">
          {date.toLocaleDateString(locale, {
            weekday: "long",
          })}
        </p>
        <p className="v8-heading mt-2 text-5xl font-black">
          {date.getDate()}
        </p>
        <p className="v8-muted mt-2 text-sm">
          {date.toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          type="button"
          onClick={() => openCreate(date)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          {tx("إضافة حدث", "Add event")}
        </button>
      </section>

      <section className="v8-card rounded-md p-4">
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              locale={locale}
              onClick={() => openEvent(event)}
              large
            />
          ))}

          {!events.length ? (
            <Empty
              text={tx(
                "لا توجد أحداث في هذا اليوم",
                "No events on this day"
              )}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ListView({
  events,
  locale,
  tx,
  openEvent,
}: {
  events: CalendarEvent[];
  locale: string;
  tx: (ar: string, en: string) => string;
  openEvent: (event: CalendarEvent) => void;
}) {
  const groups = events.reduce<
    Record<string, CalendarEvent[]>
  >((result, event) => {
    result[event.date] ??= [];
    result[event.date].push(event);
    return result;
  }, {});

  return (
    <div className="mt-4 space-y-4">
      {Object.entries(groups).map(
        ([date, dateEvents]) => (
          <section
            key={date}
            className="v8-card rounded-md p-4"
          >
            <h4 className="v8-heading border-b pb-3 font-semibold">
              {new Date(
                `${date}T12:00:00`
              ).toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h4>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  onClick={() =>
                    openEvent(event)
                  }
                  large
                />
              ))}
            </div>
          </section>
        )
      )}

      {!events.length ? (
        <Empty
          text={tx(
            "لا توجد أحداث قادمة",
            "No upcoming events"
          )}
        />
      ) : null}
    </div>
  );
}

function EventPill({
  event,
  locale,
  onClick,
}: {
  event: CalendarEvent;
  locale: string;
  onClick: (
    event: MouseEvent<HTMLButtonElement>
  ) => void;
}) {
  const tone =
    event.kind === "call"
      ? "bg-amber-100 text-amber-900"
      : event.kind === "meeting"
        ? "bg-emerald-100 text-emerald-900"
        : "bg-sky-100 text-sky-900";

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${event.title} - ${formatDateTime(
        event.start,
        locale
      )}`}
      className={`block w-full truncate rounded px-1.5 py-1 text-start text-[10px] ${
        event.overdue
          ? "bg-red-100 text-red-800"
          : tone
      } ${
        event.completed
          ? "line-through opacity-55"
          : ""
      }`}
    >
      {!event.allDay ? (
        <span className="me-1 font-bold">
          {formatTime(event.start, locale)}
        </span>
      ) : null}
      {event.title}
    </button>
  );
}

function EventCard({
  event,
  locale,
  onClick,
  large = false,
}: {
  event: CalendarEvent;
  locale: string;
  onClick: () => void;
  large?: boolean;
}) {
  const Icon =
    event.kind === "call"
      ? Phone
      : event.kind === "meeting"
        ? UsersRound
        : CheckCircle2;

  const color =
    event.overdue
      ? "bg-red-500"
      : event.kind === "call"
        ? "bg-amber-500"
        : event.kind === "meeting"
          ? "bg-emerald-500"
          : "bg-sky-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`v8-toolbar flex w-full items-start gap-3 rounded border p-3 text-start ${
        large ? "min-h-24" : ""
      }`}
    >
      <span
        className={`rounded p-2 text-white ${color}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`v8-heading block truncate text-sm font-semibold ${
            event.completed
              ? "line-through opacity-60"
              : ""
          }`}
        >
          {event.title}
        </span>
        <span className="v8-muted mt-1 block text-xs">
          {event.allDay
            ? event.date
            : formatDateTime(
                event.start,
                locale
              )}
        </span>
        {event.subtitle ? (
          <span className="v8-muted mt-1 block truncate text-[11px]">
            {event.subtitle}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function EventModal({
  tx,
  isArabic,
  activeEvent,
  form,
  setForm,
  leads,
  profiles,
  canAssign,
  ownerName,
  leadName,
  saving,
  message,
  error,
  close,
  save,
  complete,
  remove,
}: {
  tx: (ar: string, en: string) => string;
  isArabic: boolean;
  activeEvent: CalendarEvent | null;
  form: EventForm;
  setForm: Dispatch<SetStateAction<EventForm>>;
  leads: LeadEvent[];
  profiles: Profile[];
  canAssign: boolean;
  ownerName: (ownerId: string | null) => string;
  leadName: (leadId: string | null) => string;
  saving: boolean;
  message: string;
  error: string;
  close: () => void;
  save: () => void;
  complete: () => void;
  remove: () => void;
}) {
  const leadFollowUp =
    activeEvent?.source === "lead";

  function updateField<K extends keyof EventForm>(
    key: K,
    value: EventForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3">
      <button
        type="button"
        onClick={close}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        aria-label={tx(
          "إغلاق النافذة",
          "Close modal"
        )}
      />

      <section className="v8-card relative z-10 max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-xl p-4 shadow-2xl md:p-6">
        <div
          className="flex items-start justify-between gap-4 border-b pb-4"
          style={{
            borderColor: "var(--v8-border)",
          }}
        >
          <div>
            <p className="text-xs font-semibold text-emerald-600">
              {leadFollowUp
                ? tx(
                    "متابعة عميل",
                    "Customer follow-up"
                  )
                : activeEvent
                  ? tx(
                      "تعديل الحدث",
                      "Edit event"
                    )
                  : tx(
                      "حدث جديد",
                      "New event"
                    )}
            </p>
            <h3 className="v8-heading mt-1 text-xl font-bold">
              {activeEvent?.title ??
                tx(
                  "إضافة موعد إلى التقويم",
                  "Add an event to the calendar"
                )}
            </h3>
          </div>

          <button
            type="button"
            onClick={close}
            className="v8-button rounded p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="v8-heading mb-2 block text-sm font-semibold">
              {tx("نوع الحدث", "Event type")}
            </span>
            <select
              value={form.eventType}
              onChange={(event) =>
                updateField(
                  "eventType",
                  event.target.value as EventKind
                )
              }
              disabled={leadFollowUp}
              className="w-full rounded border px-3 py-2.5 text-sm disabled:opacity-60"
              style={{
                borderColor: "var(--v8-border)",
                background:
                  "var(--v8-panel-muted)",
              }}
            >
              <option value="call">
                {tx("مكالمة", "Call")}
              </option>
              <option value="meeting">
                {tx("اجتماع", "Meeting")}
              </option>
              <option value="task">
                {tx("مهمة", "Task")}
              </option>
            </select>
          </label>

          <label className="block">
            <span className="v8-heading mb-2 block text-sm font-semibold">
              {tx("التاريخ والوقت", "Date and time")}
            </span>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(event) =>
                updateField(
                  "dueDate",
                  event.target.value
                )
              }
              className="w-full rounded border px-3 py-2.5 text-sm"
              style={{
                borderColor: "var(--v8-border)",
                background:
                  "var(--v8-panel-muted)",
              }}
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="v8-heading mb-2 block text-sm font-semibold">
            {tx("العنوان", "Title")}
          </span>
          <input
            value={form.title}
            onChange={(event) =>
              updateField(
                "title",
                event.target.value
              )
            }
            disabled={leadFollowUp}
            placeholder={tx(
              "مثال: متابعة عرض دورة PMP",
              "Example: Follow up PMP offer"
            )}
            className="w-full rounded border px-3 py-2.5 text-sm disabled:opacity-60"
            style={{
              borderColor: "var(--v8-border)",
              background:
                "var(--v8-panel-muted)",
            }}
          />
        </label>

        <label className="mt-4 block">
          <span className="v8-heading mb-2 block text-sm font-semibold">
            {tx(
              "الوصف والملاحظات",
              "Description and notes"
            )}
          </span>
          <textarea
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
            rows={4}
            placeholder={tx(
              "اكتب المطلوب والخطوة القادمة...",
              "Write requirements and next action..."
            )}
            className="w-full rounded border px-3 py-3 text-sm"
            style={{
              borderColor: "var(--v8-border)",
              background:
                "var(--v8-panel-muted)",
            }}
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="v8-heading mb-2 block text-sm font-semibold">
              {tx("العميل", "Customer")}
            </span>
            <select
              value={form.leadId}
              onChange={(event) =>
                updateField(
                  "leadId",
                  event.target.value
                )
              }
              disabled={leadFollowUp}
              className="w-full rounded border px-3 py-2.5 text-sm disabled:opacity-60"
              style={{
                borderColor: "var(--v8-border)",
                background:
                  "var(--v8-panel-muted)",
              }}
            >
              <option value="">
                {tx(
                  "بدون عميل",
                  "No customer"
                )}
              </option>
              {leads.map((lead) => (
                <option
                  key={lead.id}
                  value={lead.id}
                >
                  {lead.full_name ??
                    lead.customer_code ??
                    lead.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="v8-heading mb-2 block text-sm font-semibold">
              {tx("المسؤول", "Owner")}
            </span>
            <select
              value={form.ownerId}
              onChange={(event) =>
                updateField(
                  "ownerId",
                  event.target.value
                )
              }
              disabled={!canAssign || leadFollowUp}
              className="w-full rounded border px-3 py-2.5 text-sm disabled:opacity-60"
              style={{
                borderColor: "var(--v8-border)",
                background:
                  "var(--v8-panel-muted)",
              }}
            >
              {profiles.map((profile) => (
                <option
                  key={profile.id}
                  value={profile.id}
                >
                  {profile.full_name ??
                    profile.email ??
                    profile.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="v8-heading mb-2 block text-sm font-semibold">
              {tx("الأولوية", "Priority")}
            </span>
            <select
              value={form.priority}
              onChange={(event) =>
                updateField(
                  "priority",
                  event.target.value
                )
              }
              disabled={leadFollowUp}
              className="w-full rounded border px-3 py-2.5 text-sm disabled:opacity-60"
              style={{
                borderColor: "var(--v8-border)",
                background:
                  "var(--v8-panel-muted)",
              }}
            >
              <option value="low">
                {tx("منخفضة", "Low")}
              </option>
              <option value="medium">
                {tx("متوسطة", "Medium")}
              </option>
              <option value="high">
                {tx("مرتفعة", "High")}
              </option>
              <option value="urgent">
                {tx("عاجلة", "Urgent")}
              </option>
            </select>
          </label>
        </div>

        <label className="v8-muted mt-4 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(event) =>
              updateField(
                "allDay",
                event.target.checked
              )
            }
            disabled={leadFollowUp}
            className="h-4 w-4 accent-emerald-500"
          />
          {tx(
            "حدث طوال اليوم",
            "All-day event"
          )}
        </label>

        {activeEvent ? (
          <div className="v8-toolbar mt-4 grid gap-3 rounded border p-3 text-sm md:grid-cols-3">
            <Info
              label={tx("المسؤول", "Owner")}
              value={ownerName(
                activeEvent.ownerId
              )}
            />
            <Info
              label={tx("العميل", "Customer")}
              value={
                leadName(activeEvent.leadId) ||
                tx("بدون عميل", "No customer")
              }
            />
            <Info
              label={tx("الحالة", "Status")}
              value={
                activeEvent.completed
                  ? tx("منتهي", "Finished")
                  : activeEvent.overdue
                    ? tx("متأخر", "Overdue")
                    : tx("قادم", "Upcoming")
              }
            />
          </div>
        ) : null}

        {message ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex flex-wrap gap-2">
            {activeEvent?.leadId ? (
              <Link
                href={`/customers/${
                  activeEvent.customerCode ??
                  activeEvent.leadId
                }`}
                className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                {tx(
                  "فتح ملف العميل",
                  "Open customer"
                )}
              </Link>
            ) : null}

            {activeEvent &&
            !activeEvent.completed ? (
              <button
                type="button"
                onClick={complete}
                disabled={saving}
                className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-sm text-emerald-600"
              >
                <CalendarCheck2 className="h-4 w-4" />
                {tx(
                  "إنهاء الحدث",
                  "Complete event"
                )}
              </button>
            ) : null}

            {activeEvent?.source === "task" ? (
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-sm text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                {tx("حذف", "Delete")}
              </button>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              disabled={saving}
              className="v8-button rounded px-4 py-2.5 text-sm"
            >
              {tx("إلغاء", "Cancel")}
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarCheck2 className="h-4 w-4" />
              )}
              {saving
                ? tx(
                    "جاري الحفظ...",
                    "Saving..."
                  )
                : tx(
                    "حفظ التغييرات",
                    "Save changes"
                  )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CalendarStat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?:
    | "default"
    | "blue"
    | "red"
    | "amber"
    | "green";
}) {
  const toneClass =
    tone === "blue"
      ? "text-sky-600"
      : tone === "red"
        ? "text-red-600"
        : tone === "amber"
          ? "text-amber-600"
          : tone === "green"
            ? "text-emerald-600"
            : "v8-heading";

  return (
    <div className="v8-card rounded-md p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="v8-muted text-xs">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${toneClass}`}
          >
            {value}
          </p>
        </div>
        <Icon
          className={`h-6 w-6 ${toneClass}`}
        />
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="v8-muted text-xs">
        {label}
      </p>
      <p className="v8-heading mt-1 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="v8-muted py-12 text-center text-sm">
      {text}
    </div>
  );
}
