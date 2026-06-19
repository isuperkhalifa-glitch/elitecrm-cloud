"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  List,
  Phone,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";

type LeadEvent = {
  id: string;
  full_name: string | null;
  owner_id: string | null;
  status: string | null;
  next_follow_up_at: string | null;
  phone: string | null;
};

type TaskEvent = {
  id: string;
  title: string | null;
  status: string | null;
  due_date: string | null;
  owner_id: string | null;
  related_id: string | null;
};

type CalendarEvent = {
  id: string;
  date: string;
  kind: "call" | "meeting" | "task";
  title: string;
  subtitle: string;
  completed: boolean;
};

type ViewMode = "month" | "week" | "day" | "list";

type FilterKey = "finished" | "calls" | "meetings" | "tasks";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isCompletedStatus(status: string | null) {
  return ["paid", "completed", "done", "closed", "finished", "not_interested", "wrong_number"].includes(
    (status ?? "").toLowerCase()
  );
}

function isMeetingTitle(title: string | null) {
  const value = (title ?? "").toLowerCase();
  return value.includes("meeting") || value.includes("meet") || value.includes("اجتماع") || value.includes("مقابلة");
}

export function CalendarClient({ leads, tasks }: { leads: LeadEvent[]; tasks: TaskEvent[] }) {
  const router = useRouter();
  const { language } = useI18n();
  const isArabic = language === "ar";

  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
    finished: true,
    calls: true,
    meetings: true,
    tasks: true,
  });
  const [refreshing, setRefreshing] = useState(false);

  const allEvents = useMemo<CalendarEvent[]>(() => {
    const rows: CalendarEvent[] = [];

    for (const lead of leads) {
      if (!lead.next_follow_up_at) continue;
      rows.push({
        id: `lead-${lead.id}`,
        date: lead.next_follow_up_at.slice(0, 10),
        kind: "call",
        title: lead.full_name ?? (isArabic ? "عميل بدون اسم" : "Unnamed customer"),
        subtitle: lead.phone ?? "",
        completed: isCompletedStatus(lead.status),
      });
    }

    for (const task of tasks) {
      if (!task.due_date) continue;
      const meeting = isMeetingTitle(task.title);
      rows.push({
        id: `task-${task.id}`,
        date: task.due_date.slice(0, 10),
        kind: meeting ? "meeting" : "task",
        title: task.title ?? (isArabic ? "مهمة بدون عنوان" : "Untitled task"),
        subtitle: task.status ?? "",
        completed: isCompletedStatus(task.status),
      });
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [isArabic, leads, tasks]);

  const visibleEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (!filters.finished && event.completed) return false;
      if (event.kind === "call" && !filters.calls) return false;
      if (event.kind === "meeting" && !filters.meetings) return false;
      if (event.kind === "task" && !filters.tasks) return false;
      return true;
    });
  }, [allEvents, filters]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayKey = dateKey(new Date());

  const monthCells = Array.from({ length: cellCount }, (_, index) => {
    const day = index - startOffset + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });

  const weekdays = isArabic
    ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedEvents = visibleEvents.filter((event) => event.date === selected);
  const weekStart = startOfWeek(new Date(`${selected}T12:00:00`));
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const upcomingEvents = visibleEvents.filter((event) => event.date >= todayKey).slice(0, 100);

  const monthLabel = cursor.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
    month: "long",
    year: "numeric",
  });

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function moveMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    setCursor(next);
    setSelected(dateKey(next));
  }

  function goToday() {
    const today = new Date();
    setCursor(today);
    setSelected(dateKey(today));
  }

  function toggleFilter(key: FilterKey) {
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  }

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  }

  const filterItems: Array<{ key: FilterKey; ar: string; en: string }> = [
    { key: "finished", ar: "إظهار المنتهي", en: "Show finished" },
    { key: "calls", ar: "إظهار المكالمات", en: "Show calls" },
    { key: "meetings", ar: "إظهار الاجتماعات", en: "Show meetings" },
    { key: "tasks", ar: "إظهار المهام", en: "Show tasks" },
  ];

  return (
    <section className="v8-card rounded-md p-3 md:p-4">
      <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between" style={{ borderColor: "var(--v8-border)" }}>
        <h2 className="v8-heading text-xl font-semibold">{tx("التقويم", "Calendar")}</h2>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {filterItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleFilter(item.key)}
              className="inline-flex items-center gap-2 text-sm v8-muted"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded ${
                  filters[item.key] ? "bg-emerald-500 text-white" : "border"
                }`}
                style={filters[item.key] ? undefined : { borderColor: "var(--v8-border)" }}
              >
                {filters[item.key] ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="v8-calendar-desktop-label">{tx(item.ar, item.en)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => moveMonth(-1)} className="v8-button rounded px-3 py-2">
            {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => moveMonth(1)} className="v8-button rounded px-3 py-2">
            {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <button type="button" onClick={goToday} className="v8-button rounded px-3 py-2 text-sm">
            {tx("اليوم", "Today")}
          </button>
          <button type="button" onClick={refresh} className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {tx("تحديث", "Refresh")}
          </button>
        </div>

        <h3 className="v8-heading text-center text-2xl font-semibold">{monthLabel}</h3>

        <div className="flex justify-start gap-1 xl:justify-end">
          {([
            ["month", tx("شهر", "Month")],
            ["week", tx("أسبوع", "Week")],
            ["day", tx("يوم", "Day")],
            ["list", tx("قائمة", "List")],
          ] as Array<[ViewMode, string]>).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded px-3 py-2 text-sm ${viewMode === mode ? "v8-button-active" : "v8-button"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "month" ? (
        <div className="v8-calendar-grid mt-4 grid grid-cols-7 overflow-hidden border" dir="ltr">
          {weekdays.map((day) => (
            <div key={day} className="v8-calendar-head border-b border-e p-2 text-center text-xs font-semibold">
              {day}
            </div>
          ))}

          {monthCells.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="v8-calendar-cell min-h-28 border-b border-e opacity-55" />;
            }

            const currentDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = visibleEvents.filter((event) => event.date === currentDate);
            const selectedClass = selected === currentDate ? "v8-calendar-cell-selected" : "";
            const todayClass = todayKey === currentDate ? "v8-calendar-cell-today" : "";

            return (
              <button
                type="button"
                key={currentDate}
                onClick={() => setSelected(currentDate)}
                className={`v8-calendar-cell min-h-28 border-b border-e p-2 text-start align-top ${selectedClass} ${todayClass}`}
              >
                <span className="v8-heading text-sm font-semibold">{day}</span>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <EventPill key={event.id} event={event} />
                  ))}
                  {dayEvents.length > 3 ? <div className="v8-muted text-[10px]">+{dayEvents.length - 3}</div> : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {viewMode === "week" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {weekDays.map((date) => {
            const key = dateKey(date);
            const events = visibleEvents.filter((event) => event.date === key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`v8-card min-h-44 rounded p-3 text-start ${selected === key ? "v8-calendar-cell-selected" : ""}`}
              >
                <p className="v8-muted text-xs">{date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { weekday: "long" })}</p>
                <p className="v8-heading mt-1 text-lg font-semibold">{date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { day: "numeric", month: "short" })}</p>
                <div className="mt-3 space-y-1">
                  {events.map((event) => <EventPill key={event.id} event={event} />)}
                  {!events.length ? <p className="v8-muted text-xs">{tx("لا توجد أحداث", "No events")}</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {viewMode === "day" ? (
        <EventList
          title={tx("أحداث اليوم المحدد", "Selected day events")}
          date={selected}
          events={selectedEvents}
          emptyLabel={tx("لا توجد متابعات في هذا اليوم", "No follow-ups on this day")}
        />
      ) : null}

      {viewMode === "list" ? (
        <EventList
          title={tx("قائمة المتابعات القادمة", "Upcoming follow-ups")}
          date=""
          events={upcomingEvents}
          emptyLabel={tx("لا توجد متابعات قادمة", "No upcoming follow-ups")}
        />
      ) : null}

      {viewMode === "month" ? (
        <EventList
          title={tx("تفاصيل اليوم المحدد", "Selected day details")}
          date={selected}
          events={selectedEvents}
          emptyLabel={tx("لا توجد متابعات في هذا اليوم", "No follow-ups on this day")}
          compact
        />
      ) : null}
    </section>
  );
}

function EventPill({ event }: { event: CalendarEvent }) {
  const classes =
    event.kind === "call"
      ? "bg-amber-100 text-amber-800"
      : event.kind === "meeting"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-sky-100 text-sky-800";

  return (
    <div className={`truncate rounded px-1.5 py-1 text-[10px] ${classes} ${event.completed ? "opacity-60 line-through" : ""}`}>
      {event.title}
    </div>
  );
}

function EventList({
  title,
  date,
  events,
  emptyLabel,
  compact = false,
}: {
  title: string;
  date: string;
  events: CalendarEvent[];
  emptyLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={`v8-card mt-4 rounded p-4 ${compact ? "" : "min-h-72"}`}>
      <div className="flex items-center justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--v8-border)" }}>
        <div>
          <h3 className="v8-heading text-lg font-semibold">{title}</h3>
          {date ? <p className="v8-muted mt-1 text-xs">{date}</p> : null}
        </div>
        <List className="v8-muted h-5 w-5" />
      </div>

      <div className={`mt-3 grid gap-2 ${compact ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {events.map((event) => (
          <div key={event.id} className="v8-toolbar flex items-start gap-3 rounded border p-3">
            <span className="rounded p-2 text-white" style={{ background: event.kind === "call" ? "#d99b29" : event.kind === "meeting" ? "#18a57f" : "#3b82b8" }}>
              {event.kind === "call" ? (
                <Phone className="h-4 w-4" />
              ) : event.kind === "meeting" ? (
                <UsersRound className="h-4 w-4" />
              ) : event.completed ? (
                <CalendarCheck2 className="h-4 w-4" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`v8-heading truncate text-sm font-semibold ${event.completed ? "line-through opacity-60" : ""}`}>{event.title}</p>
              <p className="v8-muted mt-1 truncate text-xs">{event.subtitle || event.date}</p>
              {!date ? <p className="v8-muted mt-1 text-[11px]">{event.date}</p> : null}
            </div>
          </div>
        ))}

        {!events.length ? <div className="v8-muted py-10 text-center text-sm md:col-span-2 xl:col-span-3">{emptyLabel}</div> : null}
      </div>
    </div>
  );
}
