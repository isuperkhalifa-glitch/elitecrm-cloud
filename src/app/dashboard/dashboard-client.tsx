"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  PhoneCall,
  PhoneMissed,
  Receipt,
  TrendingUp,
  UserCheck,
  UsersRound,
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
  created_at: string;
};

type Activity = {
  id: string;
  lead_id: string | null;
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

type Company = {
  id: string;
  name: string;
};

type Props = {
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  leads: Lead[];
  registrations: Registration[];
  tasks: Task[];
  activities: Activity[];
  profiles: Profile[];
  companies: Company[];
};

function startDateValue() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return first.toISOString().slice(0, 10);
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function inRange(value: string, from: string, to: string) {
  const date = new Date(value).getTime();
  const start = new Date(from + "T00:00:00").getTime();
  const end = new Date(to + "T23:59:59").getTime();
  return date >= start && date <= end;
}

function statusOf(lead: Lead) {
  return lead.customer_status ?? lead.status ?? "";
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
}: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const [from, setFrom] = useState(startDateValue());
  const [to, setTo] = useState(todayValue());

  const tx = (ar: string, en: string) => (isArabic ? ar : en);

  const filteredLeads = useMemo(
    () => leads.filter((item) => inRange(item.created_at, from, to)),
    [leads, from, to]
  );
  const filteredRegistrations = useMemo(
    () => registrations.filter((item) => inRange(item.created_at, from, to)),
    [registrations, from, to]
  );
  const filteredActivities = useMemo(
    () => activities.filter((item) => inRange(item.created_at, from, to)),
    [activities, from, to]
  );

  const distributed = filteredLeads.filter((item) => Boolean(item.owner_id)).length;
  const manual = filteredLeads.filter((item) =>
    ["manual", "manually_entered", "manual_queue"].includes((item.source ?? "").toLowerCase())
  ).length;
  const interested = filteredLeads.filter((item) => statusOf(item) === "interested").length;
  const notInterested = filteredLeads.filter((item) => statusOf(item) === "not_interested").length;
  const missed = filteredLeads.filter((item) => statusOf(item) === "missed").length;
  const wrongNumbers = filteredLeads.filter((item) => statusOf(item) === "wrong_number").length;
  const paid = filteredLeads.filter((item) => statusOf(item) === "paid").length;
  const paidRegistrations = filteredRegistrations.filter(
    (item) => item.payment_status === "paid" || item.status === "paid"
  ).length;
  const totalPaid = filteredRegistrations.reduce(
    (sum, item) => sum + Number(item.paid_amount ?? 0),
    0
  );
  const netFresh = Math.max(0, distributed + manual - wrongNumbers);
  const conversion = netFresh ? Math.round((Math.max(paid, paidRegistrations) / netFresh) * 1000) / 10 : 0;
  const interestedRatio = interested + notInterested
    ? Math.round((interested / (interested + notInterested)) * 1000) / 10
    : 0;

  const agents = profiles.filter((item) => item.role === "sales" || item.role === "manager");

  const agentRows = agents
    .map((agent) => {
      const agentLeads = filteredLeads.filter((item) => item.owner_id === agent.id);
      const agentPaid = filteredRegistrations.filter(
        (item) =>
          item.sales_id === agent.id &&
          (item.payment_status === "paid" || item.status === "paid")
      );
      const agentCalls = filteredActivities.filter(
        (item) => item.actor_name && item.actor_name === agent.full_name
      );
      return {
        id: agent.id,
        name: agent.full_name ?? agent.email ?? "-",
        leads: agentLeads.length,
        paid: agentPaid.length,
        calls: agentCalls.length,
        missed: agentLeads.filter((item) => statusOf(item) === "missed").length,
      };
    })
    .sort((a, b) => b.calls + b.leads - (a.calls + a.leads))
    .slice(0, 8);

  const maxAgent = Math.max(1, ...agentRows.map((item) => Math.max(item.calls, item.leads)));
  const maxMissed = Math.max(1, ...agentRows.map((item) => item.missed));

  const today = new Date();
  const todayTasks = tasks.filter((item) => {
    if (!item.due_date) return false;
    return new Date(item.due_date).toDateString() === today.toDateString();
  });
  const overdueTasks = tasks.filter((item) => {
    if (!item.due_date || item.status === "done" || item.status === "completed") return false;
    return new Date(item.due_date) < today;
  });

  const latestFeed = [
    ...filteredRegistrations.slice(0, 4).map((item) => ({
      id: "reg-" + item.id,
      title: tx("تسجيل جديد", "New registration"),
      body: tx(
        `قيمة التسجيل ${Number(item.final_price ?? 0).toLocaleString()} ر.س`,
        `Registration value ${Number(item.final_price ?? 0).toLocaleString()} SAR`
      ),
      date: item.created_at,
    })),
    ...filteredLeads.slice(0, 4).map((item) => ({
      id: "lead-" + item.id,
      title: tx("عميل جديد", "New customer"),
      body: item.full_name ?? "-",
      date: item.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const topMetrics = [
    { label: tx("مكالمات السيلز", "Sales calls"), value: filteredActivities.length, icon: PhoneCall },
    { label: tx("المكالمات المتصلة", "Connected calls"), value: Math.max(0, filteredActivities.length - missed), icon: CheckCircle2 },
    { label: tx("المكالمات المكتملة", "Made calls"), value: filteredActivities.length, icon: PhoneCall },
    { label: tx("إجمالي المهتمين", "Total interested"), value: interested, icon: TrendingUp },
  ];

  const secondMetrics = [
    { label: tx("كل العملاء", "All customers"), value: filteredLeads.length, icon: UsersRound },
    { label: tx("تم توزيعهم", "Distributed"), value: distributed, icon: UserCheck },
    { label: tx("أرقام خاطئة", "Wrong numbers"), value: wrongNumbers, icon: PhoneMissed },
    { label: tx("إدخال يدوي", "Manually entered"), value: manual, icon: Receipt },
  ];

  return (
    <AppShell titleKey="dashboard" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-300 pb-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs text-slate-500">
              {tx("يتم تحديث الإحصائيات من قاعدة البيانات مباشرة", "Statistics are updated from the database")}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#617b96]">
              {tx("لوحة أداء المبيعات", "Sales performance dashboard")}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-500">{tx("من", "From")}</label>
            <input value={from} onChange={(event) => setFrom(event.target.value)} type="date" className="rounded border border-slate-300 bg-white px-2 py-2 text-xs" />
            <label className="text-xs text-slate-500">{tx("إلى", "To")}</label>
            <input value={to} onChange={(event) => setTo(event.target.value)} type="date" className="rounded border border-slate-300 bg-white px-2 py-2 text-xs" />
          </div>
        </div>

        <MetricStrip items={topMetrics} />
        <MetricStrip items={secondMetrics} />

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title={tx("السيلز النشط خلال الفترة", "Active agents this period")}>
            <BarList rows={agentRows.map((item) => ({ label: item.name, value: item.calls || item.leads }))} max={maxAgent} />
          </ChartCard>

          <ChartCard title={tx("أفضل السيلز خلال الفترة", "Best agents this period")}>
            <BarList rows={[...agentRows].sort((a, b) => b.paid - a.paid).map((item) => ({ label: item.name, value: item.paid }))} max={Math.max(1, ...agentRows.map((item) => item.paid))} />
          </ChartCard>

          <ChartCard title={tx("مؤشرات التحويل", "Conversion indicators")}>
            <div className="grid h-full place-items-center py-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <Ratio value={conversion} label={tx("تحويل إلى مدفوع", "Paid conversion")} />
                <Ratio value={interestedRatio} label={tx("نسبة الاهتمام", "Interested ratio")} />
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_2.1fr]">
          <ChartCard title={tx(`نشاط الفريق ${todayValue()}`, `Team activity ${todayValue()}`)}>
            <div className="space-y-2">
              {agentRows.slice(0, 6).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between rounded bg-slate-100 px-3 py-2 text-xs">
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    {agent.name}
                  </span>
                  <span className="font-semibold text-[#617b96]">
                    {agent.calls || agent.leads}
                  </span>
                </div>
              ))}
              {!agentRows.length ? <Empty text={tx("لا يوجد نشاط بعد", "No activity yet")} /> : null}
            </div>
          </ChartCard>

          <ChartCard title={tx("المكالمات الفائتة لكل موظف", "Missed calls per employee")}>
            <HorizontalBars
              rows={agentRows.map((item) => ({ label: item.name, value: item.missed }))}
              max={maxMissed}
            />
          </ChartCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <SmallStat icon={CalendarClock} label={tx("متابعات اليوم", "Today follow-ups")} value={todayTasks.length} />
          <SmallStat icon={Clock3} label={tx("متابعات متأخرة", "Overdue follow-ups")} value={overdueTasks.length} />
          <SmallStat icon={Receipt} label={tx("تسجيلات مدفوعة", "Paid registrations")} value={paidRegistrations} />
          <SmallStat icon={TrendingUp} label={tx("إجمالي المحصل", "Collected revenue")} value={`${totalPaid.toLocaleString()} ر.س`} />
        </div>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h3 className="border-b border-slate-200 pb-3 text-lg font-semibold text-[#617b96]">
            {tx("آخر التحديثات", "Latest updates")}
          </h3>
          <div className="divide-y divide-slate-200">
            {latestFeed.map((item) => (
              <div key={item.id} className="grid gap-1 py-3 text-sm md:grid-cols-[180px_1fr_170px]">
                <span className="font-semibold text-[#617b96]">{item.title}</span>
                <span>{item.body}</span>
                <span className="text-xs text-slate-400">{new Date(item.date).toLocaleString(isArabic ? "ar-EG" : "en-US")}</span>
              </div>
            ))}
            {!latestFeed.length ? <Empty text={tx("لا توجد تحديثات في الفترة المحددة", "No updates in selected period")} /> : null}
          </div>
          <div className="mt-3 flex justify-end">
            <Link href="/customers" className="text-sm font-semibold text-emerald-600 hover:underline">
              {tx("فتح العملاء", "Open customers")}
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricStrip({ items }: { items: Array<{ label: string; value: string | number; icon: typeof PhoneCall }> }) {
  return (
    <div className="grid overflow-hidden rounded-[22px] border border-dashed border-slate-500 bg-white md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`px-5 py-3 ${index ? "border-t border-slate-300 md:border-s xl:border-t-0" : ""}`}>
            <p className="flex items-center gap-1 text-xs text-[#6f89a4]">
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </p>
            <p className="mt-1 text-4xl font-bold text-[#6f89a4]">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-h-64 rounded border border-slate-300 bg-white p-4">
      <h3 className="border-b border-slate-200 pb-3 text-lg font-medium text-[#6f89a4]">{title}</h3>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function BarList({ rows, max }: { rows: Array<{ label: string; value: number }>; max: number }) {
  return (
    <div className="flex h-52 items-end gap-2 border-b border-slate-300 px-2">
      {rows.slice(0, 8).map((row) => (
        <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <span className="text-[10px] font-semibold text-slate-500">{row.value}</span>
          <div className="w-full bg-[#29455f]" style={{ height: `${Math.max(4, (row.value / max) * 150)}px` }} />
          <span className="w-full truncate text-center text-[9px] text-slate-500" title={row.label}>{row.label}</span>
        </div>
      ))}
      {!rows.length ? <Empty text="-" /> : null}
    </div>
  );
}

function HorizontalBars({ rows, max }: { rows: Array<{ label: string; value: number }>; max: number }) {
  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((row) => (
        <div key={row.label} className="grid grid-cols-[130px_1fr_35px] items-center gap-3 text-xs">
          <span className="truncate text-slate-500">{row.label}</span>
          <div className="h-4 rounded bg-slate-100">
            <div className="h-full rounded bg-[#29455f]" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <span className="font-semibold">{row.value}</span>
        </div>
      ))}
      {!rows.length ? <Empty text="-" /> : null}
    </div>
  );
}

function Ratio({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-emerald-500/20 text-2xl font-bold text-emerald-600">
        {value}%
      </div>
      <p className="mt-3 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function SmallStat({ icon: Icon, label, value }: { icon: typeof PhoneCall; label: string; value: string | number }) {
  return (
    <div className="rounded border border-slate-300 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="rounded bg-[#29455f]/10 p-2 text-[#29455f]"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-[#29455f]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-8 text-center text-sm text-slate-400">{text}</div>;
}
