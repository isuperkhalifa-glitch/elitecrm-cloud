"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import {
  BadgeDollarSign,
  Banknote,
  BookOpen,
  CalendarClock,
  Receipt,
  UploadCloud,
  UserCheck,
  UsersRound,
} from "lucide-react";

type Lead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  owner_id: string | null;
  created_at: string;
  program?: string | null;
};

type Task = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  owner_id: string | null;
  related_type?: string | null;
  related_id?: string | null;
  created_at: string;
};

type Deal = { id: string; owner_id: string | null; amount: number | null; created_at: string };
type Invoice = { id: string; amount: number | null; status: string | null; due_date: string | null; created_at: string };
type Commission = { id: string; sales_id: string | null; commission_amount: number | null; status: string | null; created_at: string };
type Profile = { id: string; full_name: string | null; role: string | null; is_active: boolean | null };
type Company = { id: string; name: string };

type Props = {
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  leads: Lead[];
  tasks: Task[];
  deals: Deal[];
  invoices: Invoice[];
  commissions: Commission[];
  profiles: Profile[];
  companies: Company[];
};

function isToday(value: string | null) {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
}

function isOverdue(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date < now && date.toDateString() !== now.toDateString();
}

function roleLabel(role: string | null, ar: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    developer: { ar: "\u0645\u0637\u0648\u0631 \u0627\u0644\u0646\u0638\u0627\u0645", en: "Developer" },
    admin: { ar: "\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645", en: "General Manager" },
    manager: { ar: "\u062a\u064a\u0645 \u0644\u064a\u062f\u0631 \u0633\u064a\u0644\u0632", en: "Sales Team Leader" },
    moderator: { ar: "\u0627\u0644\u0645\u0648\u062f\u064a\u0631\u064a\u062a\u0648\u0631", en: "Moderator" },
    marketer: { ar: "\u0627\u0644\u0645\u0633\u0648\u0642", en: "Marketer" },
    sales: { ar: "\u0633\u064a\u0644\u0632", en: "Sales" },
    finance: { ar: "\u0645\u0627\u0644\u064a\u0629 / \u062d\u0633\u0627\u0628\u0627\u062a", en: "Finance" },
    data_analyst: { ar: "\u0645\u062d\u0644\u0644 \u0628\u064a\u0627\u0646\u0627\u062a", en: "Data Analyst" },
  };
  return ar ? labels[role ?? "sales"]?.ar ?? "-" : labels[role ?? "sales"]?.en ?? "-";
}

export function DashboardClient({
  currentUserId,
  userEmail,
  fullName,
  role,
  leads,
  tasks,
  invoices,
  commissions,
  profiles,
  companies,
}: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const isSales = role === "sales";
  const visibleLeads = isSales ? leads.filter((lead) => lead.owner_id === currentUserId) : leads;
  const visibleTasks = isSales ? tasks.filter((task) => task.owner_id === currentUserId) : tasks;
  const visibleCommissions = isSales ? commissions.filter((item) => item.sales_id === currentUserId) : commissions;

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function money(value: number | string | null) {
    return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  const paidRows = visibleLeads.filter((lead) => lead.status === "paid").length;
  const interestedRows = visibleLeads.filter((lead) => lead.status === "interested" || lead.status === "need_offer").length;
  const todayTasks = visibleTasks.filter((task) => isToday(task.due_date)).length;
  const overdueTasks = visibleTasks.filter((task) => isOverdue(task.due_date)).length;
  const paidRevenue = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const dueCommissions = visibleCommissions.filter((item) => item.status !== "paid").reduce((sum, item) => sum + Number(item.commission_amount ?? 0), 0);

  const activeUsers = profiles.filter((profile) => profile.is_active !== false).length;

  return (
    <AppShell titleKey="dashboard" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm font-bold text-emerald-300">{tx("\u0631\u0624\u064a\u0629 \u062a\u0634\u063a\u064a\u0644\u064a\u0629 \u0646\u0638\u064a\u0641\u0629", "Clean operating view")}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{tx("\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645", "Dashboard")}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          {tx(
            "\u0647\u0630\u0647 \u0627\u0644\u0644\u0648\u062d\u0629 \u062a\u0639\u0631\u0636 \u0627\u0644\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u0641\u0642\u0637: \u0627\u0644\u0639\u0645\u0644\u0627\u0621\u060c \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0627\u062a\u060c \u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a\u060c \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a.",
            "This dashboard shows the core operation only: customers, follow-ups, registrations, payments, and commissions."
          )}
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={tx("\u0627\u0644\u0639\u0645\u0644\u0627\u0621", "Customers")} value={visibleLeads.length} icon={UsersRound} />
        <StatCard title={tx("\u0645\u0647\u062a\u0645 / \u064a\u062d\u062a\u0627\u062c \u0639\u0631\u0636", "Interested / Need offer")} value={interestedRows} icon={UserCheck} tone="blue" />
        <StatCard title={tx("\u0645\u062f\u0641\u0648\u0639", "Paid")} value={paidRows} icon={Receipt} tone="green" />
        <StatCard title={tx("\u0645\u062a\u0627\u0628\u0639\u0627\u062a \u0645\u062a\u0623\u062e\u0631\u0629", "Overdue follow-ups")} value={overdueTasks} icon={CalendarClock} tone="red" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={tx("\u0645\u062a\u0627\u0628\u0639\u0627\u062a \u0627\u0644\u064a\u0648\u0645", "Today follow-ups")} value={todayTasks} icon={CalendarClock} tone="yellow" />
        <StatCard title={tx("\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a", "Paid revenue")} value={money(paidRevenue)} icon={Banknote} tone="green" />
        <StatCard title={tx("\u0639\u0645\u0648\u0644\u0627\u062a \u0645\u0633\u062a\u062d\u0642\u0629", "Due commissions")} value={money(dueCommissions)} icon={BadgeDollarSign} tone="blue" />
        <StatCard title={tx("\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0627\u0644\u0646\u0634\u0637\u0648\u0646", "Active users")} value={activeUsers} icon={UsersRound} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-emerald-300">{tx("\u0627\u0644\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0645\u0648\u062d\u062f", "Unified operation")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{tx("\u0644\u0627 \u064a\u0648\u062c\u062f \u062a\u0643\u0631\u0627\u0631 \u0641\u064a \u0627\u0644\u0646\u0638\u0627\u0645", "No duplicate workflow")}</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <p>{tx("\u0627\u0644\u0639\u0645\u064a\u0644 \u0645\u0643\u0627\u0646\u0647 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u0641\u064a \u0635\u0641\u062d\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621.", "Customers are managed from one main page.")}</p>
            <p>{tx("\u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0648\u0627\u0644\u062f\u0641\u0639 \u0641\u064a \u0635\u0641\u062d\u0629 \u0648\u0627\u062d\u062f\u0629.", "Registration and payment are handled in one page.")}</p>
            <p>{tx("\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u064a\u0631\u0649 \u0627\u0644\u0646\u0638\u0627\u0645 \u062d\u0633\u0628 \u0635\u0644\u0627\u062d\u064a\u062a\u0647 \u0628\u0639\u062f \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644.", "Each user sees the system based on their real login role.")}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-emerald-300">{tx("\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0633\u0631\u064a\u0639\u0629", "Quick actions")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{tx("\u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0644\u0623\u062c\u0632\u0627\u0621 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629", "Open core modules")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <QuickAction href="/customers" title={tx("\u0627\u0644\u0639\u0645\u0644\u0627\u0621", "Customers")} icon={UsersRound} />
            <QuickAction href="/registrations" title={tx("\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a", "Registrations")} icon={Receipt} />
            <QuickAction href="/imports" title={tx("\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u0621", "Imports")} icon={UploadCloud} />
            <QuickAction href="/courses" title={tx("\u0627\u0644\u062f\u0648\u0631\u0627\u062a", "Courses")} icon={BookOpen} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value, icon: Icon, tone = "default" }: { title: string; value: string | number; icon: any; tone?: "default" | "green" | "red" | "blue" | "yellow" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : tone === "red"
        ? "border-red-500/20 bg-red-500/10 text-red-300"
        : tone === "blue"
          ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
          : tone === "yellow"
            ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
            : "border-white/10 bg-white/[0.04] text-white";

  return (
    <div className={`rounded-[2rem] border p-5 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm opacity-80">{title}</p>
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-3 text-3xl font-black">{value}</h2>
    </div>
  );
}

function QuickAction({ href, title, icon: Icon }: { href: string; title: string; icon: any }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm font-bold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
        <Icon className="h-5 w-5" />
      </span>
      <span>{title}</span>
    </Link>
  );
}