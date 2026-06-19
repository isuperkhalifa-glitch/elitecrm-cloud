"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, CheckSquare } from "lucide-react";
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

export function CalendarClient({ leads, tasks }: { leads: LeadEvent[]; tasks: TaskEvent[] }) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const events = useMemo(() => {
    const rows: Array<{ id: string; date: string; type: "lead" | "task"; title: string; subtitle: string }> = [];
    for (const lead of leads) {
      if (!lead.next_follow_up_at) continue;
      rows.push({
        id: "lead-" + lead.id,
        date: lead.next_follow_up_at.slice(0, 10),
        type: "lead",
        title: lead.full_name ?? "-",
        subtitle: lead.phone ?? "",
      });
    }
    for (const task of tasks) {
      if (!task.due_date) continue;
      rows.push({
        id: "task-" + task.id,
        date: task.due_date.slice(0, 10),
        type: "task",
        title: task.title ?? "-",
        subtitle: task.status ?? "",
      });
    }
    return rows;
  }, [leads, tasks]);

  const days = Array.from({ length: startOffset + daysInMonth }, (_, index) => {
    if (index < startOffset) return null;
    return index - startOffset + 1;
  });

  const selectedEvents = events.filter((item) => item.date === selected);
  const weekdays = isArabic
    ? ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function moveMonth(offset: number) {
    setCursor(new Date(year, month + offset, 1));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <section className="rounded border border-slate-300 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => moveMonth(-1)} className="rounded border border-slate-300 p-2 hover:bg-slate-100">
            {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <h2 className="text-xl font-semibold text-[#617b96]">
            {cursor.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "long", year: "numeric" })}
          </h2>
          <button type="button" onClick={() => moveMonth(1)} className="rounded border border-slate-300 p-2 hover:bg-slate-100">
            {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-7 border border-slate-200">
          {weekdays.map((day) => (
            <div key={day} className="border-b border-slate-200 bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            if (!day) return <div key={"empty-" + index} className="min-h-28 border-b border-s border-slate-200 bg-slate-50/40" />;
            const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = events.filter((item) => item.date === date);
            return (
              <button
                type="button"
                key={date}
                onClick={() => setSelected(date)}
                className={`min-h-28 border-b border-s border-slate-200 p-2 text-start align-top hover:bg-slate-50 ${
                  selected === date ? "bg-emerald-50 ring-2 ring-inset ring-emerald-400" : ""
                }`}
              >
                <span className="text-sm font-semibold text-slate-600">{day}</span>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className={`truncate rounded px-1.5 py-1 text-[10px] ${
                      event.type === "lead" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                    }`}>
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 ? <div className="text-[10px] text-slate-400">+{dayEvents.length - 3}</div> : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded border border-slate-300 bg-white p-4">
        <h3 className="border-b border-slate-200 pb-3 text-lg font-semibold text-[#617b96]">
          {isArabic ? "متابعات اليوم المحدد" : "Selected day follow-ups"}
        </h3>
        <p className="mt-2 text-xs text-slate-400">{selected}</p>
        <div className="mt-4 space-y-2">
          {selectedEvents.map((event) => (
            <div key={event.id} className="rounded border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <div className={`rounded p-2 ${event.type === "lead" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>
                  {event.type === "lead" ? <Phone className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{event.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
          {!selectedEvents.length ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {isArabic ? "لا توجد متابعات في هذا اليوم" : "No follow-ups on this day"}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
