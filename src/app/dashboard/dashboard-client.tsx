"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";
import { useSystemSettings } from "@/components/system-settings-provider";
import {
  BadgeDollarSign,
  Banknote,
  BookOpen,
  CalendarClock,
  FileSpreadsheet,
  Receipt,
  Route,
  ShieldCheck,
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

type Deal = { id: string; owner_id: string | null; company_id: string | null; amount: number | null; };
type Invoice = { id: string; owner_id: string | null; company_id: string | null; deal_id: string | null; amount: number | null; status: string | null; paid_at: string | null; due_date: string | null; created_at: string; };
type Commission = { id: string; sales_id: string | null; company_id: string | null; invoice_id: string | null; commission_amount: number | null; status: string | null; paid_at: string | null; created_at: string; };
type Profile = { id: string; full_name: string | null; role: string | null; is_active: boolean | null; };
type Company = { id: string; name: string; };

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

const ar = {
  dashboardTitle: "\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645",
  desc: "\u0645\u062a\u0627\u0628\u0639\u0629 \u0645\u062e\u062a\u0635\u0631\u0629 \u0644\u0644\u062a\u0634\u063a\u064a\u0644: \u0627\u0644\u0639\u0645\u0644\u0627\u0621\u060c \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0627\u062a\u060c \u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a\u060c \u0648\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a \u062d\u0633\u0628 \u0646\u0637\u0627\u0642 \u0627\u0644\u0639\u0631\u0636.",
  allSystem: "\u0643\u0644 \u0627\u0644\u0646\u0638\u0627\u0645",
  asUser: "\u0643\u0645\u0633\u062a\u062e\u062f\u0645",
  center: "\u0645\u0631\u0643\u0632 \u062a\u062f\u0631\u064a\u0628",
  adminView: "\u0631\u0624\u064a\u0629 \u0627\u0644\u0645\u062f\u064a\u0631",
  userPreview: "\u0645\u0639\u0627\u064a\u0646\u0629 \u0645\u0633\u062a\u062e\u062f\u0645",
  customers: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  interested: "\u0645\u0647\u062a\u0645",
  paid: "\u0645\u062f\u0641\u0648\u0639",
  todayFollowups: "\u0645\u062a\u0627\u0628\u0639\u0627\u062a \u0627\u0644\u064a\u0648\u0645",
  overdueFollowups: "\u0645\u062a\u0627\u0628\u0639\u0627\u062a \u0645\u062a\u0623\u062e\u0631\u0629",
  dueCommissions: "\u0639\u0645\u0648\u0644\u0627\u062a \u0645\u0633\u062a\u062d\u0642\u0629",
  activeUsers: "\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0646\u0634\u0637\u0648\u0646",
  trainingCenters: "\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u062f\u0631\u064a\u0628",
  quickActions: "\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0633\u0631\u064a\u0639\u0629",
  quickDesc: "\u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0641\u0642\u0637 \u0628\u062f\u0648\u0646 \u062a\u0643\u0631\u0627\u0631.",
  customersAction: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  customersActionDesc: "\u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0627\u062a \u0645\u0646 \u0645\u0643\u0627\u0646 \u0648\u0627\u062d\u062f.",
  registrationsAction: "\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a \u0648\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a",
  registrationsActionDesc: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0639\u0645\u064a\u0644 \u0648\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u062f\u0641\u0648\u0639 \u0648\u0627\u0644\u0645\u062a\u0628\u0642\u064a.",
  importsAction: "\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  importsActionDesc: "\u0631\u0641\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0645\u0646 \u0645\u0644\u0641 Excel.",
  distributionAction: "\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  distributionActionDesc: "\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0639\u0644\u0649 \u0641\u0631\u064a\u0642 \u0627\u0644\u0633\u064a\u0644\u0632.",
  coursesAction: "\u0627\u0644\u062f\u0648\u0631\u0627\u062a",
  coursesActionDesc: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062f\u0648\u0631\u0627\u062a \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0627\u0644\u0645\u0631\u0627\u0643\u0632.",
  commissionsAction: "\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631",
  commissionsActionDesc: "\u0645\u062a\u0627\u0628\u0639\u0629 \u0639\u0645\u0648\u0644\u0627\u062a \u0627\u0644\u0633\u064a\u0644\u0632 \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631.",
  visibility: "\u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062d\u0627\u0644\u064a\u0629",
  visibilityDesc: "\u0627\u0644\u0646\u0638\u0627\u0645 \u064a\u0639\u0631\u0636 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u062d\u0633\u0628 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062e\u062a\u0627\u0631 \u0645\u0646 \u0627\u0644\u0647\u064a\u062f\u0631.",
  salesView: "\u0627\u0644\u0633\u064a\u0644\u0632 \u064a\u0631\u0649 \u0639\u0645\u0644\u0627\u0621\u0647 \u0648\u0645\u062a\u0627\u0628\u0639\u0627\u062a\u0647 \u0648\u0639\u0645\u0648\u0644\u0627\u062a\u0647 \u0641\u0642\u0637.",
  moderatorView: "\u0627\u0644\u0645\u0648\u062f\u064a\u0631\u064a\u062a\u0648\u0631 \u064a\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0625\u062f\u062e\u0627\u0644 \u0648\u0627\u0644\u062a\u0648\u0632\u064a\u0639.",
  financeView: "\u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u062a\u0631\u0627\u062c\u0639 \u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a.",
  adminViewDesc: "\u0627\u0644\u0645\u062f\u064a\u0631 \u064a\u0631\u0649 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u062d\u0633\u0628 \u0646\u0637\u0627\u0642 \u0627\u0644\u0639\u0631\u0636.",
  recentCustomers: "\u0622\u062e\u0631 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  noCustomers: "\u0644\u0627 \u064a\u0648\u062c\u062f \u0639\u0645\u0644\u0627\u0621 \u062f\u0627\u062e\u0644 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u062d\u0627\u0644\u064a.",
  status: "\u0627\u0644\u062d\u0627\u0644\u0629",
  program: "\u0627\u0644\u062f\u0648\u0631\u0629",
  unknown: "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
  viewCustomer: "\u0641\u062a\u062d \u0627\u0644\u0639\u0645\u064a\u0644",
};

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isOverdue(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date < now && date.toDateString() !== now.toDateString();
}

function statusLabel(status: string | null, isArabic: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    interested: { ar: "\u0645\u0647\u062a\u0645", en: "Interested" },
    not_interested: { ar: "\u063a\u064a\u0631 \u0645\u0647\u062a\u0645", en: "Not interested" },
    need_offer: { ar: "\u064a\u062d\u062a\u0627\u062c \u0639\u0631\u0636", en: "Needs offer" },
    missed: { ar: "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0631\u062f", en: "Missed" },
    wrong_number: { ar: "\u0631\u0642\u0645 \u062e\u0637\u0623", en: "Wrong number" },
    paid: { ar: "\u0645\u062f\u0641\u0648\u0639", en: "Paid" },
    busy: { ar: "\u0645\u0634\u063a\u0648\u0644", en: "Busy" },
  };
  const fallback = status || (isArabic ? ar.unknown : "Unknown");
  return isArabic ? labels[status ?? ""]?.ar ?? fallback : labels[status ?? ""]?.en ?? fallback;
}

export function DashboardClient({
  currentUserId,
  userEmail,
  fullName,
  role,
  leads,
  tasks,
  deals,
  invoices,
  commissions,
  profiles,
  companies,
}: Props) {
  const { language } = useI18n();
  const { scope } = useScope();
  const { getBooleanSetting } = useSystemSettings();
  const isArabic = language === "ar";

  function tx(arText: string, enText: string) {
    return isArabic ? arText : enText;
  }

  function money(value: number | string | null) {
    return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
  }

  const selectedCompanyName = companies.find((company) => company.id === scope.targetId)?.name ?? scope.targetName;
  const scopedLeads = scope.mode === "user"
    ? leads.filter((lead) => lead.owner_id === scope.targetId)
    : scope.mode === "company"
      ? leads.filter((lead) => selectedCompanyName ? (lead.company_name ?? "").toLowerCase().includes(selectedCompanyName.toLowerCase()) : false)
      : leads;

  const scopedTasks = scope.mode === "user"
    ? tasks.filter((task) => task.owner_id === scope.targetId)
    : scope.mode === "company"
      ? tasks.filter((task) => task.related_type === "company" && task.related_id === scope.targetId)
      : tasks;

  const scopedDeals = scope.mode === "user"
    ? deals.filter((deal) => deal.owner_id === scope.targetId)
    : scope.mode === "company"
      ? deals.filter((deal) => deal.company_id === scope.targetId)
      : deals;

  const scopedInvoices = scope.mode === "user"
    ? invoices.filter((invoice) => invoice.owner_id === scope.targetId)
    : scope.mode === "company"
      ? invoices.filter((invoice) => invoice.company_id === scope.targetId)
      : invoices;

  const scopedCommissions = scope.mode === "user"
    ? commissions.filter((commission) => commission.sales_id === scope.targetId)
    : scope.mode === "company"
      ? commissions.filter((commission) => commission.company_id === scope.targetId)
      : commissions;

  const previewRole = scope.mode === "user" && scope.previewMode === "selected" ? scope.targetRole : role ?? "admin";
  const commissionsEnabled = getBooleanSetting("features.commissions.enabled", true);
  const interestedCount = scopedLeads.filter((lead) => lead.status === "interested" || lead.status === "need_offer").length;
  const paidCount = scopedLeads.filter((lead) => lead.status === "paid").length;
  const todayTasks = scopedTasks.filter((task) => isToday(task.due_date)).length;
  const overdueTasks = scopedTasks.filter((task) => isOverdue(task.due_date)).length;
  const dueCommissionAmount = scopedCommissions.filter((item) => item.status === "due").reduce((sum, item) => sum + Number(item.commission_amount ?? 0), 0);
  const paidInvoiceAmount = scopedInvoices.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  function StatCard({ title, value, icon: Icon, tone = "default" }: { title: string; value: string | number; icon: any; tone?: "default" | "green" | "red" | "blue" | "yellow" }) {
    const toneClass = tone === "green" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : tone === "red" ? "border-red-500/20 bg-red-500/10 text-red-300" : tone === "blue" ? "border-sky-400/20 bg-sky-400/10 text-sky-300" : tone === "yellow" ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300" : "border-white/10 bg-white/[0.04] text-white";
    return (
      <div className={`safe-card rounded-[2rem] border p-5 ${toneClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm opacity-80">{title}</p>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-3xl font-black">{value}</h2>
      </div>
    );
  }

  function QuickAction({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: any }) {
    return (
      <Link href={href} className="elite-motion-card block rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-emerald-400/30 hover:bg-emerald-400/10">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Icon className="h-5 w-5" /></div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </Link>
    );
  }

  const canImport = ["developer", "admin", "moderator", "marketer"].includes(previewRole);
  const canDistribute = ["developer", "admin", "manager", "moderator"].includes(previewRole);

  return (
    <AppShell titleKey="dashboard" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-emerald-300">{tx(ar.desc, "A clean operating summary for customers, follow-ups, registrations, and payments by scope.")}</p>
            <h1 className="mt-1 text-3xl font-black text-white">{scope.mode === "all" ? tx(ar.dashboardTitle, "Dashboard") : `${tx(ar.dashboardTitle, "Dashboard")} - ${scope.targetName ?? ""}`}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">{scope.mode === "all" ? tx(ar.allSystem, "All system") : scope.mode === "user" ? tx(ar.asUser, "As user") : tx(ar.center, "Training center")}</span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-300">{scope.mode === "user" && scope.previewMode === "selected" ? tx(ar.userPreview, "User preview") : tx(ar.adminView, "Admin view")}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={tx(ar.customers, "Customers")} value={scopedLeads.length} icon={UsersRound} />
        <StatCard title={tx(ar.interested, "Interested")} value={interestedCount} icon={UserCheck} tone="blue" />
        <StatCard title={tx(ar.paid, "Paid")} value={paidCount} icon={Banknote} tone="green" />
        <StatCard title={tx(ar.todayFollowups, "Today follow-ups")} value={todayTasks} icon={CalendarClock} tone="yellow" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={tx(ar.overdueFollowups, "Overdue follow-ups")} value={overdueTasks} icon={CalendarClock} tone="red" />
        <StatCard title={tx(ar.activeUsers, "Active users")} value={profiles.filter((item) => item.is_active !== false).length} icon={ShieldCheck} />
        <StatCard title={tx(ar.trainingCenters, "Training centers")} value={companies.length} icon={BookOpen} />
        <StatCard title={commissionsEnabled ? tx(ar.dueCommissions, "Due commissions") : tx(ar.paid, "Paid")} value={commissionsEnabled ? money(dueCommissionAmount) : money(paidInvoiceAmount)} icon={BadgeDollarSign} tone="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-emerald-300">{tx(ar.visibility, "Current visibility")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{tx(ar.visibilityDesc, "The system displays data based on the selected header scope.")}</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
            {previewRole === "sales" ? <p>â€¢ {tx(ar.salesView, "Sales sees own customers, follow-ups, and commissions only.")}</p> : null}
            {previewRole === "moderator" ? <p>â€¢ {tx(ar.moderatorView, "Moderator focuses on intake and assignment.")}</p> : null}
            {previewRole === "finance" ? <p>â€¢ {tx(ar.financeView, "Finance reviews payments and commissions.")}</p> : null}
            {!["sales", "moderator", "finance"].includes(previewRole) ? <p>â€¢ {tx(ar.adminViewDesc, "Managers see the full picture based on the current scope.")}</p> : null}
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-emerald-300">{tx(ar.quickActions, "Quick actions")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">{tx(ar.quickDesc, "Core pages only, without duplication.")}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <QuickAction href="/customers" title={tx(ar.customersAction, "Manage customers")} description={tx(ar.customersActionDesc, "All customers and follow-ups in one place.")} icon={UsersRound} />
            <QuickAction href="/registrations" title={tx(ar.registrationsAction, "Registrations & payments")} description={tx(ar.registrationsActionDesc, "Register customers and track paid/balance amounts.")} icon={Receipt} />
            {canImport ? <QuickAction href="/imports" title={tx(ar.importsAction, "Import customers")} description={tx(ar.importsActionDesc, "Upload customers from Excel.")} icon={UploadCloud} /> : null}
            {canDistribute ? <QuickAction href="/distribution" title={tx(ar.distributionAction, "Distribute customers")} description={tx(ar.distributionActionDesc, "Assign customers to the sales team.")} icon={Route} /> : null}
            <QuickAction href="/courses" title={tx(ar.coursesAction, "Courses")} description={tx(ar.coursesActionDesc, "Manage courses linked to training centers.")} icon={BookOpen} />
            {commissionsEnabled ? <QuickAction href="/commissions" title={tx(ar.commissionsAction, "Commissions & reports")} description={tx(ar.commissionsActionDesc, "Track sales commissions and reports.")} icon={FileSpreadsheet} /> : null}
          </div>
        </section>
      </div>

      <section className="safe-card mt-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-emerald-300">{tx(ar.recentCustomers, "Recent customers")}</p>
        <div className="mt-4 grid gap-3">
          {scopedLeads.slice(0, 8).map((lead) => (
            <Link key={lead.id} href={`/customers/${lead.id}`} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-emerald-400/30">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black text-white">{lead.full_name || lead.phone || tx(ar.unknown, "Unknown")}</h3>
                  <p className="mt-1 text-sm text-slate-400">{tx(ar.program, "Program")}: {lead.program || tx(ar.unknown, "Unknown")}</p>
                </div>
                <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{tx(ar.status, "Status")}: {statusLabel(lead.status, isArabic)}</span>
              </div>
            </Link>
          ))}
          {!scopedLeads.length ? <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-400">{tx(ar.noCustomers, "No customers in the current scope.")}</div> : null}
        </div>
      </section>
    </AppShell>
  );
}
