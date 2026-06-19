"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Megaphone,
  PhoneCall,
  PhoneForwarded,
  Receipt,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";

type Lead = {
  id: string;
  full_name: string | null;
  owner_id: string | null;
  company_id: string | null;
  status: string | null;
  customer_status: string | null;
  lead_type: string | null;
  source: string | null;
  created_at: string;
  next_follow_up_at: string | null;
  paid_amount: number | null;
};

type Registration = {
  id: string;
  lead_id: string | null;
  sales_id: string | null;
  company_id: string | null;
  status: string | null;
  payment_status: string | null;
  final_price: number | null;
  paid_amount: number | null;
  created_at: string;
};

type Task = {
  id: string;
  title: string | null;
  status: string | null;
  due_date: string | null;
  owner_id: string | null;
  related_id: string | null;
  created_at: string;
};

type ActivityRow = {
  id: string;
  lead_id: string | null;
  actor_id: string | null;
  actor_name: string | null;
  action: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type Company = { id: string; name: string };

type CallLog = {
  id: string;
  lead_id: string | null;
  actor_id?: string | null;
  sales_id?: string | null;
  actor_name?: string | null;
  outcome?: string | null;
  call_status?: string | null;
  duration_minutes?: number | null;
  duration_seconds?: number | null;
  created_at: string;
};

type AttendanceLog = {
  id: string;
  user_id: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  activity_count?: number | null;
  created_at: string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience_role: string | null;
  is_active: boolean | null;
  created_by_name?: string | null;
  pinned?: boolean | null;
  created_at: string;
};

type Props = {
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  leads: Lead[];
  registrations: Registration[];
  tasks: Task[];
  activities: ActivityRow[];
  profiles: Profile[];
  companies: Company[];
  callLogs: CallLog[];
  attendanceLogs: AttendanceLog[];
  announcements: Announcement[];
};

type Period = "today" | "week" | "month" | "custom";

function dateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function periodRange(period: Exclude<Period, "custom">) {
  const now = new Date();
  const from = startOfDay(now);
  if (period === "week") from.setDate(from.getDate() - 6);
  if (period === "month") from.setDate(1);
  return { from: dateInput(from), to: dateInput(now) };
}

function inRange(value: string | null | undefined, from: string, to: string) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return (
    timestamp >= new Date(`${from}T00:00:00`).getTime() &&
    timestamp <= new Date(`${to}T23:59:59.999`).getTime()
  );
}

function statusOf(lead: Lead) {
  return lead.customer_status ?? lead.status ?? "";
}

function actorId(call: CallLog) {
  return call.actor_id ?? call.sales_id ?? null;
}

function callOutcome(call: CallLog) {
  const value = (call.outcome ?? call.call_status ?? "").toLowerCase();
  if (["no_answer", "no reply", "missed"].includes(value)) return "missed";
  if (["wrong number", "wrong_number"].includes(value)) return "wrong_number";
  if (["converted", "paid"].includes(value)) return "paid";
  return value || "interested";
}

function formatTime(value: string | null, locale: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DashboardClient({
  userEmail,
  fullName,
  role,
  leads,
  registrations,
  tasks,
  activities,
  profiles,
  companies,
  callLogs,
  attendanceLogs,
  announcements,
}: Props) {
  const router = useRouter();
  const { language } = useI18n();
  const isArabic = language === "ar";
  const locale = isArabic ? "ar-EG" : "en-US";
  const initialRange = periodRange("month");

  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [refreshing, setRefreshing] = useState(false);

  const tx = (ar: string, en: string) => (isArabic ? ar : en);

  function choosePeriod(nextPeriod: Exclude<Period, "custom">) {
    const range = periodRange(nextPeriod);
    setPeriod(nextPeriod);
    setFrom(range.from);
    setTo(range.to);
  }

  function refreshDashboard() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  }

  const filteredLeads = useMemo(
    () => leads.filter((item) => inRange(item.created_at, from, to)),
    [leads, from, to]
  );
  const filteredRegistrations = useMemo(
    () => registrations.filter((item) => inRange(item.created_at, from, to)),
    [registrations, from, to]
  );
  const filteredCalls = useMemo(
    () => callLogs.filter((item) => inRange(item.created_at, from, to)),
    [callLogs, from, to]
  );
  const filteredActivities = useMemo(
    () => activities.filter((item) => inRange(item.created_at, from, to)),
    [activities, from, to]
  );

  const connectedCalls = filteredCalls.filter(
    (call) => !["missed", "wrong_number"].includes(callOutcome(call))
  ).length;
  const madeCalls = filteredCalls.length;
  const interestedLeadIds = new Set(
    filteredCalls
      .filter((call) =>
        ["interested", "need_offer", "busy", "paid"].includes(callOutcome(call))
      )
      .map((call) => call.lead_id)
      .filter(Boolean)
  );
  const interestedLeads = filteredLeads.filter((lead) =>
    ["interested", "need_offer", "busy", "paid"].includes(statusOf(lead))
  ).length;
  const totalInterested = Math.max(interestedLeadIds.size, interestedLeads);

  const distributed = filteredLeads.filter((lead) => Boolean(lead.owner_id)).length;
  const retargeted = filteredLeads.filter(
    (lead) => lead.lead_type === "retargeted"
  ).length;
  const manual = filteredLeads.filter((lead) =>
    ["manual", "manually_entered", "manual_queue", "يدوي"].includes(
      (lead.source ?? "").toLowerCase()
    )
  ).length;
  const wrongNumbers = filteredLeads.filter(
    (lead) => statusOf(lead) === "wrong_number"
  ).length;
  const paidLeads = filteredLeads.filter(
    (lead) => statusOf(lead) === "paid"
  ).length;
  const paidRegistrations = filteredRegistrations.filter(
    (item) => item.payment_status === "paid" || item.status === "paid"
  ).length;
  const totalPaid = filteredRegistrations.reduce(
    (sum, item) => sum + Number(item.paid_amount ?? 0),
    0
  );
  const netFresh = Math.max(0, distributed + manual - wrongNumbers);
  const conversion = netFresh
    ? Math.round(
        (Math.max(paidLeads, paidRegistrations) / netFresh) * 1000
      ) / 10
    : 0;

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const last30Start = new Date(now);
  last30Start.setDate(last30Start.getDate() - 29);
  last30Start.setHours(0, 0, 0, 0);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const agents = profiles.filter((profile) =>
    ["sales", "manager"].includes(profile.role ?? "")
  );

  const agentRows = agents
    .map((agent) => {
      const agentCalls = callLogs.filter((call) => actorId(call) === agent.id);
      const callsSeason = agentCalls.filter(
        (call) => new Date(call.created_at) >= yearStart
      ).length;
      const calls30 = agentCalls.filter(
        (call) => new Date(call.created_at) >= last30Start
      ).length;
      const callsPeriod = filteredCalls.filter(
        (call) => actorId(call) === agent.id
      ).length;
      const missedToday = agentCalls.filter((call) => {
        const date = new Date(call.created_at);
        return (
          date >= todayStart &&
          date <= todayEnd &&
          callOutcome(call) === "missed"
        );
      }).length;
      const paidSeason = registrations.filter(
        (registration) =>
          registration.sales_id === agent.id &&
          new Date(registration.created_at) >= yearStart &&
          (registration.payment_status === "paid" ||
            registration.status === "paid")
      ).length;
      return {
        id: agent.id,
        name: agent.full_name ?? agent.email ?? "-",
        callsSeason,
        calls30,
        callsPeriod,
        missedToday,
        paidSeason,
      };
    })
    .sort((a, b) => b.callsPeriod - a.callsPeriod);

  const maxSeasonCalls = Math.max(
    1,
    ...agentRows.map((item) => item.callsSeason)
  );
  const max30Calls = Math.max(1, ...agentRows.map((item) => item.calls30));
  const maxPaid = Math.max(1, ...agentRows.map((item) => item.paidSeason));
  const maxMissed = Math.max(
    1,
    ...agentRows.map((item) => item.missedToday)
  );

  const overdueTasks = tasks.filter((task) => {
    if (
      !task.due_date ||
      ["done", "completed"].includes(task.status ?? "")
    ) {
      return false;
    }
    return new Date(task.due_date) < now;
  });
  const todayTasks = tasks.filter(
    (task) =>
      task.due_date &&
      new Date(task.due_date).toDateString() === now.toDateString()
  );

  const attendanceRows = agents
    .map((agent) => {
      const entries = attendanceLogs.filter(
        (entry) =>
          entry.user_id === agent.id &&
          new Date(entry.created_at).toDateString() === now.toDateString()
      );
      const latest = entries.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0];
      const callsToday = callLogs.filter((call) => {
        const date = new Date(call.created_at);
        return (
          actorId(call) === agent.id &&
          date >= todayStart &&
          date <= todayEnd
        );
      }).length;
      const activityToday = activities.filter((activity) => {
        const date = new Date(activity.created_at);
        return (
          activity.actor_id === agent.id &&
          date >= todayStart &&
          date <= todayEnd
        );
      }).length;
      return {
        id: agent.id,
        name: agent.full_name ?? agent.email ?? "-",
        checkIn: latest?.check_in_at ?? null,
        checkOut: latest?.check_out_at ?? null,
        activity:
          Number(latest?.activity_count ?? 0) +
          callsToday +
          activityToday,
        present: Boolean(latest?.check_in_at || callsToday || activityToday),
      };
    })
    .filter((item) => item.present)
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 8);

  const latestUpdates = [
    ...announcements.map((item) => ({
      id: `announcement-${item.id}`,
      title: item.title,
      body: item.body,
      author:
        item.created_by_name ??
        tx("إدارة النظام", "System administration"),
      date: item.created_at,
      pinned: Boolean(item.pinned),
    })),
    ...filteredRegistrations.slice(0, 4).map((item) => ({
      id: `registration-${item.id}`,
      title: tx("تسجيل جديد", "New registration"),
      body: tx(
        `قيمة التسجيل ${Number(item.final_price ?? 0).toLocaleString()} ر.س`,
        `Registration value ${Number(
          item.final_price ?? 0
        ).toLocaleString()} SAR`
      ),
      author: tx("فريق المبيعات", "Sales team"),
      date: item.created_at,
      pinned: false,
    })),
    ...filteredLeads.slice(0, 4).map((item) => ({
      id: `lead-${item.id}`,
      title: tx("عميل جديد", "New customer"),
      body: item.full_name ?? "-",
      author: item.source ?? tx("النظام", "System"),
      date: item.created_at,
      pinned: false,
    })),
  ]
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 10);

  const firstStrip = [
    {
      label: tx("مكالمات السيلز", "Sales calls"),
      value: filteredCalls.length,
      icon: PhoneCall,
    },
    {
      label: tx("المكالمات المتصلة", "Connected calls"),
      value: connectedCalls,
      icon: PhoneForwarded,
    },
    {
      label: tx("المكالمات المكتملة", "Made calls"),
      value: madeCalls,
      icon: CheckCircle2,
    },
    {
      label: tx("إجمالي المهتمين", "Total interested"),
      value: totalInterested,
      icon: TrendingUp,
    },
  ];

  const secondStrip = [
    {
      label: tx("كل العملاء", "All customers"),
      value: filteredLeads.length,
      icon: UsersRound,
    },
    {
      label: tx("تم توزيعهم", "Distributed"),
      value: distributed,
      icon: UserCheck,
    },
    {
      label: tx("إعادة استهداف", "Retargeted"),
      value: retargeted,
      icon: RefreshCw,
    },
    {
      label: tx("إدخال يدوي", "Manually entered"),
      value: manual,
      icon: Receipt,
    },
  ];

  return (
    <AppShell
      titleKey="dashboard"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="space-y-4">
        <section className="v8-card rounded-md p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600">
                {tx("مركز التشغيل المباشر", "Live operations center")}
              </p>
              <h2 className="v8-heading mt-1 text-2xl font-bold">
                {tx(
                  "لوحة أداء المبيعات",
                  "Sales performance dashboard"
                )}
              </h2>
              <p className="v8-muted mt-1 text-sm">
                {tx(
                  "الأرقام تُقرأ مباشرة من العملاء والمكالمات والتسجيلات.",
                  "Metrics are calculated directly from customers, calls, and registrations."
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["today", "week", "month"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => choosePeriod(item)}
                  className={`rounded px-3 py-2 text-xs font-semibold ${
                    period === item ? "v8-button-active" : "v8-button"
                  }`}
                >
                  {item === "today"
                    ? tx("اليوم", "Today")
                    : item === "week"
                      ? tx("7 أيام", "7 days")
                      : tx("هذا الشهر", "This month")}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPeriod("custom")}
                className={`rounded px-3 py-2 text-xs font-semibold ${
                  period === "custom"
                    ? "v8-button-active"
                    : "v8-button"
                }`}
              >
                {tx("فترة مخصصة", "Custom range")}
              </button>
              <input
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPeriod("custom");
                }}
                type="date"
                className="v8-button rounded px-2 py-2 text-xs"
              />
              <input
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPeriod("custom");
                }}
                type="date"
                className="v8-button rounded px-2 py-2 text-xs"
              />
              <button
                type="button"
                onClick={refreshDashboard}
                className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                {tx("تحديث", "Refresh")}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <QuickLink
              href="/calls"
              label={tx("تشغيل المكالمات", "Run calls")}
              icon={PhoneCall}
            />
            <QuickLink
              href="/calendar"
              label={tx("فتح التقويم", "Open calendar")}
              icon={CalendarClock}
            />
            <QuickLink
              href="/customers"
              label={tx("فتح العملاء", "Open customers")}
              icon={UsersRound}
            />
          </div>
        </section>

        <MetricStrip items={firstStrip} />
        <MetricStrip items={secondStrip} />

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard
            title={tx(
              `السيلز النشط خلال ${now.getFullYear()}`,
              `Active agents in ${now.getFullYear()}`
            )}
            subtitle={tx("حسب عدد المكالمات", "By call count")}
          >
            <VerticalBars
              rows={agentRows.map((item) => ({
                label: item.name,
                value: item.callsSeason,
              }))}
              max={maxSeasonCalls}
            />
          </ChartCard>

          <ChartCard
            title={tx(
              "السيلز النشط آخر 30 يوم",
              "Active agents last 30 days"
            )}
            subtitle={tx(
              "المكالمات المنفذة",
              "Completed calls"
            )}
          >
            <VerticalBars
              rows={agentRows.map((item) => ({
                label: item.name,
                value: item.calls30,
              }))}
              max={max30Calls}
            />
          </ChartCard>

          <ChartCard
            title={tx(
              `أفضل السيلز خلال ${now.getFullYear()}`,
              `Best agents in ${now.getFullYear()}`
            )}
            subtitle={tx(
              "حسب التسجيلات المدفوعة",
              "By paid registrations"
            )}
          >
            <VerticalBars
              rows={[...agentRows]
                .sort((a, b) => b.paidSeason - a.paidSeason)
                .map((item) => ({
                  label: item.name,
                  value: item.paidSeason,
                }))}
              max={maxPaid}
              accent
            />
          </ChartCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_2.1fr]">
          <ChartCard
            title={tx(
              `الحضور ${dateInput(now)}`,
              `Attendance ${dateInput(now)}`
            )}
            subtitle={tx(
              "الدخول والخروج والنشاط",
              "Check-in, check-out, and activity"
            )}
          >
            <div className="space-y-2">
              {attendanceRows.map((item) => (
                <div
                  key={item.id}
                  className="v8-toolbar flex items-center justify-between gap-3 rounded border px-3 py-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span className="v8-heading truncate font-semibold">
                      {item.name}
                    </span>
                  </span>
                  <span className="v8-muted shrink-0" dir="ltr">
                    {formatTime(item.checkIn, locale)} -{" "}
                    {formatTime(item.checkOut, locale)} |{" "}
                    {item.activity}
                  </span>
                </div>
              ))}
              {!attendanceRows.length ? (
                <Empty
                  text={tx(
                    "لا يوجد نشاط مسجل اليوم",
                    "No activity recorded today"
                  )}
                />
              ) : null}
            </div>
          </ChartCard>

          <ChartCard
            title={tx(
              `المكالمات الفائتة لكل موظف ${dateInput(now)}`,
              `Missed calls per employee ${dateInput(now)}`
            )}
            subtitle={tx(
              "نتائج لم يرد خلال اليوم",
              "No-answer results today"
            )}
          >
            <HorizontalBars
              rows={agentRows.map((item) => ({
                label: item.name,
                value: item.missedToday,
              }))}
              max={maxMissed}
            />
          </ChartCard>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SmallStat
            icon={Clock3}
            label={tx("متابعات متأخرة", "Overdue follow-ups")}
            value={overdueTasks.length}
            tone="red"
          />
          <SmallStat
            icon={CalendarClock}
            label={tx("متابعات اليوم", "Today follow-ups")}
            value={todayTasks.length}
            tone="blue"
          />
          <SmallStat
            icon={Receipt}
            label={tx("تسجيلات مدفوعة", "Paid registrations")}
            value={paidRegistrations}
            tone="green"
          />
          <SmallStat
            icon={TrendingUp}
            label={tx("نسبة التحويل", "Conversion rate")}
            value={`${conversion}%`}
            tone="green"
          />
          <SmallStat
            icon={TrendingUp}
            label={tx("إجمالي المحصل", "Collected revenue")}
            value={tx(
              `${totalPaid.toLocaleString()} ر.س`,
              `${totalPaid.toLocaleString()} SAR`
            )}
            tone="green"
          />
          <SmallStat
            icon={Building2}
            label={tx("مراكز التدريب", "Training centers")}
            value={companies.length}
          />
        </div>

        <section className="v8-card rounded-md p-4">
          <div
            className="flex items-center justify-between gap-3 border-b pb-3"
            style={{ borderColor: "var(--v8-border)" }}
          >
            <div>
              <h3 className="v8-heading text-lg font-semibold">
                {tx(
                  "الإعلانات وآخر التحديثات",
                  "News and latest updates"
                )}
              </h3>
              <p className="v8-muted mt-1 text-xs">
                {tx(
                  "تنبيهات الإدارة وآخر حركة تشغيلية في النظام",
                  "Management announcements and recent operational activity"
                )}
              </p>
            </div>
            <Megaphone className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="relative mt-4 space-y-1 before:absolute before:bottom-3 before:start-[7px] before:top-3 before:w-px before:bg-slate-200">
            {latestUpdates.map((item) => (
              <article
                key={item.id}
                className="relative py-3 ps-7"
              >
                <span
                  className={`absolute start-0 top-5 h-3.5 w-3.5 rounded-full border-2 ${
                    item.pinned
                      ? "border-amber-400 bg-amber-100"
                      : "border-slate-300 bg-white"
                  }`}
                />
                <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4">
                  <div className="min-w-0">
                    <h4 className="v8-heading font-semibold">
                      {item.title}
                    </h4>
                    <p className="v8-muted mt-1 text-sm leading-6">
                      {item.body}
                    </p>
                    <p className="v8-muted mt-1 text-[11px]">
                      {tx("بواسطة", "By")} {item.author}
                    </p>
                  </div>
                  <time
                    className="v8-muted shrink-0 text-[11px]"
                    dir="ltr"
                  >
                    {formatDate(item.date, locale)}
                  </time>
                </div>
              </article>
            ))}
            {!latestUpdates.length ? (
              <Empty
                text={tx(
                  "لا توجد تحديثات في الفترة المحددة",
                  "No updates in the selected period"
                )}
              />
            ) : null}
          </div>
        </section>

        <div className="v8-card flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3 text-sm">
          <span className="v8-muted">
            {tx(
              `إجمالي النشاط في الفترة: ${filteredActivities.length}`,
              `Total activity in period: ${filteredActivities.length}`
            )}
          </span>
          <span className="v8-muted">
            {tx(
              `صافي العملاء الجدد: ${netFresh}`,
              `Net fresh customers: ${netFresh}`
            )}
          </span>
        </div>
      </div>
    </AppShell>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="v8-button inline-flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MetricStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: string | number;
    icon: LucideIcon;
  }>;
}) {
  return (
    <div className="v8-card grid overflow-hidden rounded-[20px] border border-dashed md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`px-5 py-4 ${
              index
                ? "border-t md:border-s xl:border-t-0"
                : ""
            }`}
            style={{ borderColor: "var(--v8-border)" }}
          >
            <p className="v8-muted flex items-center gap-1 text-xs">
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </p>
            <p className="v8-heading mt-1 text-4xl font-bold">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="v8-card min-h-72 rounded-md p-4">
      <div
        className="border-b pb-3"
        style={{ borderColor: "var(--v8-border)" }}
      >
        <h3 className="v8-heading text-lg font-semibold">{title}</h3>
        {subtitle ? (
          <p className="v8-muted mt-1 text-xs">{subtitle}</p>
        ) : null}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function VerticalBars({
  rows,
  max,
  accent = false,
}: {
  rows: Array<{ label: string; value: number }>;
  max: number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex h-52 items-end gap-2 border-b px-2"
      style={{ borderColor: "var(--v8-border)" }}
    >
      {rows.slice(0, 8).map((row) => (
        <div
          key={row.label}
          className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
        >
          <span className="v8-muted text-[10px] font-semibold">
            {row.value}
          </span>
          <div
            className={`w-full ${
              accent ? "bg-emerald-500" : "bg-[#29455f]"
            }`}
            style={{
              height: `${Math.max(
                4,
                (row.value / max) * 150
              )}px`,
            }}
          />
          <span
            className="v8-muted w-full truncate text-center text-[9px]"
            title={row.label}
          >
            {row.label}
          </span>
        </div>
      ))}
      {!rows.length ? <Empty text="-" /> : null}
    </div>
  );
}

function HorizontalBars({
  rows,
  max,
}: {
  rows: Array<{ label: string; value: number }>;
  max: number;
}) {
  return (
    <div className="space-y-4 py-2">
      {rows.slice(0, 10).map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-xs"
        >
          <span className="v8-muted truncate">{row.label}</span>
          <div
            className="h-4 rounded"
            style={{ background: "var(--v8-panel-muted)" }}
          >
            <div
              className="h-full rounded bg-red-400"
              style={{
                width: `${
                  row.value
                    ? Math.max(4, (row.value / max) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="v8-heading font-semibold">
            {row.value}
          </span>
        </div>
      ))}
      {!rows.length ? <Empty text="-" /> : null}
    </div>
  );
}

function SmallStat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "default" | "red" | "blue" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-600"
      : tone === "blue"
        ? "text-sky-600"
        : tone === "green"
          ? "text-emerald-600"
          : "text-[#29455f]";

  return (
    <div className="v8-card rounded-md p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded bg-slate-100 p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="v8-muted text-xs">{label}</p>
          <p className={`mt-1 text-xl font-bold ${toneClass}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="v8-muted py-8 text-center text-sm">
      {text}
    </div>
  );
}