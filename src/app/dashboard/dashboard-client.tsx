"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";
import { usePageText } from "@/components/page-settings";
import { useSystemSettings } from "@/components/system-settings-provider";
import {
  BadgeDollarSign,
  Banknote,
  Building2,
  CalendarClock,
  Eye,
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

type Deal = {
  id: string;
  title: string | null;
  company_id: string | null;
  owner_id: string | null;
  stage: string | null;
  amount: number | null;
  probability: number | null;
  expected_close_date: string | null;
  created_at: string;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  company_id: string | null;
  deal_id: string | null;
  owner_id: string | null;
  amount: number | null;
  status: string | null;
  paid_at: string | null;
  due_date: string | null;
  created_at: string;
};

type Commission = {
  id: string;
  sales_id: string | null;
  company_id: string | null;
  invoice_id: string | null;
  commission_amount: number | null;
  status: string | null;
  paid_at: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Company = {
  id: string;
  name: string;
};

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
  const isArabic = language === "ar";

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }


  const { getBooleanSetting } = useSystemSettings();
  
  const dealsEnabled = false;
  const invoicesEnabled = false;
  const commissionsEnabled = getBooleanSetting("features.commissions.enabled", true);
  const pageTitle = usePageText("pages.dashboard.title", "ط¸â€‍ط¸ث†ط·آ­ط·آ© ط·آ§ط¸â€‍ط·ع¾ط·آ­ط¸ئ’ط¸â€¦", "Dashboard");
  const pageDescription = usePageText(
    "pages.dashboard.description",
    "ط·ع¾ط·آ§ط·آ¨ط·آ¹ ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ ط¸ث†ط·آ§ط¸â€‍ط¸â€¦ط·ع¾ط·آ§ط·آ¨ط·آ¹ط·آ§ط·ع¾ ط¸ث†ط·آ§ط¸â€‍ط¸ظ¾ط¸ث†ط·آ§ط·ع¾ط¸ظ¹ط·آ± ط¸ث†ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾ ط·آ­ط·آ³ط·آ¨ ط¸â€ ط·آ·ط·آ§ط¸â€ڑ ط·آ§ط¸â€‍ط·آ¹ط·آ±ط·آ¶.",
    "Track customers, follow-ups, invoices, and commissions by scope."
  );

  function money(value: number | string | null) {
    return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  const selectedCompanyName =
    companies.find((company) => company.id === scope.targetId)?.name ?? scope.targetName;

  const scopedDeals =
    scope.mode === "user"
      ? deals.filter((deal) => deal.owner_id === scope.targetId)
      : scope.mode === "company"
        ? deals.filter((deal) => deal.company_id === scope.targetId)
        : deals;

  const scopedDealIds = new Set(scopedDeals.map((deal) => deal.id));

  const scopedInvoices =
    scope.mode === "user"
      ? invoices.filter((invoice) => invoice.owner_id === scope.targetId)
      : scope.mode === "company"
        ? invoices.filter(
            (invoice) =>
              invoice.company_id === scope.targetId ||
              Boolean(invoice.deal_id && scopedDealIds.has(invoice.deal_id))
          )
        : invoices;

  const scopedInvoiceIds = new Set(scopedInvoices.map((invoice) => invoice.id));

  const scopedLeads =
    scope.mode === "user"
      ? leads.filter((lead) => lead.owner_id === scope.targetId)
      : scope.mode === "company"
        ? leads.filter((lead) =>
            selectedCompanyName
              ? (lead.company_name ?? "").toLowerCase().includes(selectedCompanyName.toLowerCase())
              : false
          )
        : leads;

  const scopedTasks =
    scope.mode === "user"
      ? tasks.filter((task) => task.owner_id === scope.targetId)
      : scope.mode === "company"
        ? tasks.filter(
            (task) =>
              task.related_type === "company" &&
              task.related_id === scope.targetId
          )
        : tasks;

  const scopedCommissions =
    scope.mode === "user"
      ? commissions.filter((commission) => commission.sales_id === scope.targetId)
      : scope.mode === "company"
        ? commissions.filter(
            (commission) =>
              commission.company_id === scope.targetId ||
              Boolean(commission.invoice_id && scopedInvoiceIds.has(commission.invoice_id))
          )
        : commissions;

  const isUserPreview = scope.mode === "user" && scope.previewMode === "selected";
  const previewRole = isUserPreview ? scope.targetRole : role ?? "admin";

  const paidInvoices = scopedInvoices.filter((invoice) => invoice.status === "paid");
  const unpaidInvoices = scopedInvoices.filter(
    (invoice) => invoice.status !== "paid" && invoice.status !== "canceled"
  );
  const overdueInvoices = scopedInvoices.filter(
    (invoice) =>
      invoice.status !== "paid" &&
      invoice.status !== "canceled" &&
      isOverdue(invoice.due_date)
  );

  const todayTasks = scopedTasks.filter((task) => isToday(task.due_date));
  const overdueTasks = scopedTasks.filter((task) => isOverdue(task.due_date));
  const dueCommissions = scopedCommissions.filter((item) => item.status === "due");
  const paidCommissions = scopedCommissions.filter((item) => item.status === "paid");

  const paidRevenue = paidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount ?? 0),
    0
  );

  const unpaidRevenue = unpaidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount ?? 0),
    0
  );

  const dueCommissionAmount = dueCommissions.reduce(
    (sum, item) => sum + Number(item.commission_amount ?? 0),
    0
  );

  const paidCommissionAmount = paidCommissions.reduce(
    (sum, item) => sum + Number(item.commission_amount ?? 0),
    0
  );

  function StatCard({
    title,
    value,
    icon: Icon,
    tone = "default",
  }: {
    title: string;
    value: string | number;
    icon: any;
    tone?: "default" | "green" | "red" | "blue" | "yellow";
  }) {
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
      <div className={`safe-card rounded-[2rem] border p-5 ${toneClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm opacity-80">{title}</p>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-3xl font-black">{value}</h2>
      </div>
    );
  }

  function QuickAction({
    href,
    title,
    description,
    icon: Icon,
  }: {
    href: string;
    title: string;
    description: string;
    icon: any;
  }) {
    return (
      <Link
        href={href}
        className="elite-motion-card block rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-emerald-400/30 hover:bg-emerald-400/10"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </Link>
    );
  }

  const isSalesPreview = previewRole === "sales";
  const isModeratorPreview = previewRole === "moderator";
  const isFinancePreview = previewRole === "finance";

  return (
    <AppShell
      titleKey="dashboard"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-emerald-300">
              {pageDescription}
            </p>
            <h1 className="mt-1 text-3xl font-black text-white">
              {scope.mode === "all"
                ? pageTitle
                : `${pageTitle} أ¢â‚¬â€‌ ${scope.targetName ?? ""}`}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isUserPreview
                ? tx("ط·آ£ط¸â€ ط·ع¾ ط·ع¾ط·آ´ط·آ§ط¸â€،ط·آ¯ ط·ع¾ط¸â€ڑط·آ±ط¸ظ¹ط·آ¨ط¸â€¹ط·آ§ ط¸â€¦ط·آ§ ط¸ظ¹ط·آ¸ط¸â€،ط·آ± ط¸â€‍ط¸â€‍ط¸â€¦ط·آ³ط·ع¾ط·آ®ط·آ¯ط¸â€¦ ط·آ§ط¸â€‍ط¸â€¦ط·آ®ط·ع¾ط·آ§ط·آ±.", "You are previewing what the selected user sees.")
                : tx("ط·آ£ط¸â€ ط·ع¾ ط·ع¾ط·آ´ط·آ§ط¸â€،ط·آ¯ ط·آ§ط¸â€‍ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾ ط·آ¨ط·آµط¸â€‍ط·آ§ط·آ­ط¸ظ¹ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آ£ط·آ¯ط¸â€¦ط¸â€  ط·آ¯ط·آ§ط·آ®ط¸â€‍ ط·آ§ط¸â€‍ط¸â€ ط·آ·ط·آ§ط¸â€ڑ ط·آ§ط¸â€‍ط¸â€¦ط·آ­ط·آ¯ط·آ¯.", "You are viewing the selected scope with admin visibility.")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              {scope.mode === "all"
                ? tx("ط·آ§ط¸â€‍ط¸ئ’ط¸â€‍", "All")
                : scope.mode === "user"
                  ? tx("ط¸â€¦ط·آ³ط·ع¾ط·آ®ط·آ¯ط¸â€¦", "User")
                  : tx("ط·آ´ط·آ±ط¸ئ’ط·آ©", "Company")}
            </span>

            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-300">
              {isUserPreview ? tx("ط¸â€¦ط·آ¹ط·آ§ط¸ظ¹ط¸â€ ط·آ© ط¸â€¦ط·آ³ط·ع¾ط·آ®ط·آ¯ط¸â€¦", "User preview") : tx("ط·آ±ط·آ¤ط¸ظ¹ط·آ© ط·آ£ط·آ¯ط¸â€¦ط¸â€ ", "Admin view")}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={tx("ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ", "Customers")} value={scopedLeads.length} icon={UsersRound} />
        <StatCard title={tx("ط¸â€¦ط·ع¾ط·آ§ط·آ¨ط·آ¹ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط¸ظ¹ط¸ث†ط¸â€¦", "Today follow-ups")} value={todayTasks.length} icon={CalendarClock} tone="blue" />
        <StatCard title={tx("ط¸â€¦ط·ع¾ط·آ§ط·آ¨ط·آ¹ط·آ§ط·ع¾ ط¸â€¦ط·ع¾ط·آ£ط·آ®ط·آ±ط·آ©", "Overdue follow-ups")} value={overdueTasks.length} icon={CalendarClock} tone="red" />
        <StatCard title={tx("ط·آ§ط¸â€‍ط¸â€¦ط·آ¯ط¸ظ¾ط¸ث†ط·آ¹ط·آ§ط·ع¾", "Paid revenue")} value={money(paidRevenue)} icon={Banknote} tone="green" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dealsEnabled ? <StatCard title={tx("ط·آ§ط¸â€‍ط·آµط¸ظ¾ط¸â€ڑط·آ§ط·ع¾", "Deals")} value={scopedDeals.length} icon={Route} /> : null}
        {invoicesEnabled ? <StatCard title={tx("ط·آ§ط¸â€‍ط¸ظ¾ط¸ث†ط·آ§ط·ع¾ط¸ظ¹ط·آ± ط·ط›ط¸ظ¹ط·آ± ط·آ§ط¸â€‍ط¸â€¦ط·آ¯ط¸ظ¾ط¸ث†ط·آ¹ط·آ©", "Unpaid invoices")} value={money(unpaidRevenue)} icon={Receipt} tone="yellow" /> : null}
        {commissionsEnabled ? <StatCard title={tx("ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾ ط¸â€¦ط·آ³ط·ع¾ط·آ­ط¸â€ڑط·آ©", "Due commissions")} value={money(dueCommissionAmount)} icon={BadgeDollarSign} tone="blue" /> : null}
        {commissionsEnabled ? <StatCard title={tx("ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾ ط¸â€¦ط·آ¯ط¸ظ¾ط¸ث†ط·آ¹ط·آ©", "Paid commissions")} value={money(paidCommissionAmount)} icon={UserCheck} tone="green" /> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5">
            <p className="text-sm text-emerald-300">
              {tx("ط¸â€¦ط·آ§ط·آ°ط·آ§ ط¸ظ¹ط·آ¸ط¸â€،ط·آ±ط·ع؛", "Visibility")}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {tx("ط·آµط¸â€‍ط·آ§ط·آ­ط¸ظ¹ط·آ© ط·آ§ط¸â€‍ط·آ¹ط·آ±ط·آ¶ ط·آ§ط¸â€‍ط·آ­ط·آ§ط¸â€‍ط¸ظ¹ط·آ©", "Current View Permission")}
            </h2>
          </div>

          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p className="flex gap-2">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
              {isUserPreview
                ? tx("ط¸â€،ط·آ°ط¸â€، ط¸â€¦ط·آ¹ط·آ§ط¸ظ¹ط¸â€ ط·آ© ط¸â€‍ط¸â€¦ط·آ§ ط¸ظ¹ط·آ±ط·آ§ط¸â€، ط·آ§ط¸â€‍ط¸â€¦ط·آ³ط·ع¾ط·آ®ط·آ¯ط¸â€¦ ط·آ§ط¸â€‍ط¸â€¦ط·آ®ط·ع¾ط·آ§ط·آ± ط·آ¨ط¸â€ ط·آ§ط·طŒط¸â€¹ ط·آ¹ط¸â€‍ط¸â€° ط·آ¯ط¸ث†ط·آ±ط¸â€،.", "This is a preview of what the selected user sees based on their role.")
                : tx("ط¸â€،ط·آ°ط¸â€، ط·آ±ط·آ¤ط¸ظ¹ط·آ© ط·آ¥ط·آ¯ط·آ§ط·آ±ط¸ظ¹ط·آ© ط·آ¯ط·آ§ط·آ®ط¸â€‍ ط·آ§ط¸â€‍ط¸â€ ط·آ·ط·آ§ط¸â€ڑ ط·آ§ط¸â€‍ط¸â€¦ط·آ®ط·ع¾ط·آ§ط·آ±ط·إ’ ط¸â€‍ط·آ°ط¸â€‍ط¸ئ’ ط·ع¾ط·آ¸ط¸â€،ط·آ± ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾ ط·آ£ط¸ث†ط·آ³ط·آ¹.", "This is admin visibility inside the selected scope, so more data is visible.")}
            </p>

            {isSalesPreview ? (
              <>
                <p>أ¢â‚¬آ¢ {tx("ط·آ§ط¸â€‍ط·آ³ط¸ظ¹ط¸â€‍ط·آ² ط¸ظ¹ط·آ±ط¸â€° ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒط¸â€، ط¸ث†ط¸â€¦ط·ع¾ط·آ§ط·آ¨ط·آ¹ط·آ§ط·ع¾ط¸â€، ط¸ث†ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾ط¸â€، ط¸ظ¾ط¸â€ڑط·آ·.", "Sales sees own customers, follow-ups, and commissions only.")}</p>
                <p>أ¢â‚¬آ¢ {tx("ط¸â€‍ط·آ§ ط·ع¾ط·آ¸ط¸â€،ط·آ± ط¸â€‍ط¸â€، ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط¸ظ¾ط·آ±ط¸ظ¹ط¸â€ڑ ط·آ¨ط·آ§ط¸â€‍ط¸ئ’ط·آ§ط¸â€¦ط¸â€‍.", "Team-wide data is hidden from sales.")}</p>
              </>
            ) : null}

            {isModeratorPreview ? (
              <>
                <p>أ¢â‚¬آ¢ {tx("ط·آ§ط¸â€‍ط¸â€¦ط¸ث†ط·آ¯ط¸ظ¹ط·آ±ط¸ظ¹ط·ع¾ط¸ث†ط·آ± ط¸ظ¹ط·آ±ط¸ئ’ط·آ² ط·آ¹ط¸â€‍ط¸â€° ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ ط·آ§ط¸â€‍ط·آ¬ط·آ¯ط·آ¯ ط¸ث†ط·آ§ط¸â€‍ط·ع¾ط¸ث†ط·آ²ط¸ظ¹ط·آ¹.", "Moderator focuses on new customers and distribution.")}</p>
                <p>أ¢â‚¬آ¢ {tx("ط·آ§ط¸â€‍ط·ع¾ط¸ظ¾ط·آ§ط·آµط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط¸â€¦ط·آ§ط¸â€‍ط¸ظ¹ط·آ© ط·ع¾ط¸ئ’ط¸ث†ط¸â€  ط¸â€¦ط·آ­ط·آ¯ط¸ث†ط·آ¯ط·آ©.", "Financial details are limited.")}</p>
              </>
            ) : null}

            {isFinancePreview ? (
              <>
                <p>أ¢â‚¬آ¢ {tx("ط·آ§ط¸â€‍ط¸â€¦ط·آ§ط¸â€‍ط¸ظ¹ط·آ© ط·ع¾ط·آ±ط¸â€° ط·آ§ط¸â€‍ط¸ظ¾ط¸ث†ط·آ§ط·ع¾ط¸ظ¹ط·آ± ط¸ث†ط·آ§ط¸â€‍ط¸â€¦ط·آ¯ط¸ظ¾ط¸ث†ط·آ¹ط·آ§ط·ع¾ ط¸ث†ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾.", "Finance sees invoices, payments, and commissions.")}</p>
                <p>أ¢â‚¬آ¢ {tx("ط¸â€¦ط·ع¾ط·آ§ط·آ¨ط·آ¹ط·آ© ط·آ§ط¸â€‍ط·آ³ط¸ظ¹ط¸â€‍ط·آ² ط·آ§ط¸â€‍ط¸ظ¹ط¸ث†ط¸â€¦ط¸ظ¹ط·آ© ط·ع¾ط¸ئ’ط¸ث†ط¸â€  ط¸â€¦ط·آ­ط·آ¯ط¸ث†ط·آ¯ط·آ©.", "Daily sales follow-up details are limited.")}</p>
              </>
            ) : null}

            {!isUserPreview ? (
              <>
                <p>أ¢â‚¬آ¢ {tx("ط·آ§ط¸â€‍ط·آ£ط·آ¯ط¸â€¦ط¸â€  ط¸ظ¹ط·آ±ط¸â€° ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ ط¸ث†ط·آ§ط¸â€‍ط¸â€¦ط·ع¾ط·آ§ط·آ¨ط·آ¹ط·آ§ط·ع¾ ط¸ث†ط·آ§ط¸â€‍ط¸ظ¾ط¸ث†ط·آ§ط·ع¾ط¸ظ¹ط·آ± ط¸ث†ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾ ط·آ¯ط·آ§ط·آ®ط¸â€‍ ط·آ§ط¸â€‍ط¸â€ ط·آ·ط·آ§ط¸â€ڑ.", "Admin sees customers, follow-ups, invoices, and commissions inside the scope.")}</p>
                <p>أ¢â‚¬آ¢ {tx("ط¸ظ¹ط¸â€¦ط¸ئ’ط¸â€ ط¸ئ’ ط·ع¾ط·ط›ط¸ظ¹ط¸ظ¹ط·آ± ط·آ§ط¸â€‍ط¸â€ ط·آ·ط·آ§ط¸â€ڑ ط¸â€¦ط¸â€  ط·آ§ط¸â€‍ط¸â€،ط¸ظ¹ط·آ¯ط·آ± ط¸ظ¾ط¸ظ¹ ط·آ£ط¸ظ¹ ط¸ث†ط¸â€ڑط·ع¾.", "You can change the scope from the header anytime.")}</p>
              </>
            ) : null}
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5">
            <p className="text-sm text-emerald-300">
              {tx("ط·آ¥ط·آ¬ط·آ±ط·آ§ط·طŒط·آ§ط·ع¾ ط·آ³ط·آ±ط¸ظ¹ط·آ¹ط·آ©", "Quick Actions")}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {tx("ط·آ­ط·آ³ط·آ¨ ط·آ§ط¸â€‍ط·آµط¸â€‍ط·آ§ط·آ­ط¸ظ¹ط·آ© ط·آ§ط¸â€‍ط·آ­ط·آ§ط¸â€‍ط¸ظ¹ط·آ©", "Based on current visibility")}
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {!isSalesPreview ? (
              <QuickAction
                href="/imports"
                title={tx("ط·آ§ط·آ³ط·ع¾ط¸ظ¹ط·آ±ط·آ§ط·آ¯ ط·آ§ط¸â€‍ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾", "Data Import")}
                description={tx("ط·آ±ط¸ظ¾ط·آ¹ ط¸â€¦ط¸â€‍ط¸ظ¾ Excel ط¸ث†ط·آ¥ط·آ¯ط·آ®ط·آ§ط¸â€‍ ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ.", "Upload Excel and import customers.")}
                icon={UploadCloud}
              />
            ) : null}

            <QuickAction
              href="/customers"
              title={tx("ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ", "Customers")}
              description={tx("ط¸â€¦ط·ع¾ط·آ§ط·آ¨ط·آ¹ط·آ© ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ ط·آ­ط·آ³ط·آ¨ ط·آ§ط¸â€‍ط¸â€ ط·آ·ط·آ§ط¸â€ڑ.", "Follow customers based on the current scope.")}
              icon={UsersRound}
            />

            {!isModeratorPreview && invoicesEnabled ? (
              <QuickAction
                href="/registrations"
                  title={tx("ط·آ§ط¸â€‍ط¸ظ¾ط¸ث†ط·آ§ط·ع¾ط¸ظ¹ط·آ±", "Invoices")}
                  description={tx("ط¸â€¦ط·آ±ط·آ§ط·آ¬ط·آ¹ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ¯ط¸ظ¾ط¸ث†ط·آ¹ط·آ§ط·ع¾ ط¸ث†ط·آ§ط¸â€‍ط¸ظ¾ط¸ث†ط·آ§ط·ع¾ط¸ظ¹ط·آ±.", "Review invoices and payments.")}
                  icon={Receipt}
              />
            ) : null}

            {!isModeratorPreview && commissionsEnabled ? (
              <QuickAction
                href="/commissions"
                  title={tx("ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾", "Commissions")}
                  description={tx("ط¸â€¦ط·آ±ط·آ§ط·آ¬ط·آ¹ط·آ© ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸ث†ط¸â€‍ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط¸â€¦ط·آ³ط·ع¾ط·آ­ط¸â€ڑط·آ© ط¸ث†ط·آ§ط¸â€‍ط¸â€¦ط·آ¯ط¸ظ¾ط¸ث†ط·آ¹ط·آ©.", "Review due and paid commissions.")}
                  icon={BadgeDollarSign}
              />
            ) : null}
          </div>
        </section>
      </div>

      <section className="safe-card mt-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5">
          <p className="text-sm text-emerald-300">
            {tx("ط·آ¢ط·آ®ط·آ± ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ ط·آ¯ط·آ§ط·آ®ط¸â€‍ ط·آ§ط¸â€‍ط¸â€ ط·آ·ط·آ§ط¸â€ڑ", "Recent customers in scope")}
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            {tx("ط¸â€ڑط·آ§ط·آ¦ط¸â€¦ط·آ© ط¸â€¦ط·آ®ط·ع¾ط·آµط·آ±ط·آ©", "Quick list")}
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {scopedLeads.slice(0, 6).map((lead) => (
            <article
              key={lead.id}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"
            >
              <p className="truncate font-bold text-white">
                {lead.full_name ?? "-"}
              </p>
              <p className="mt-1 text-sm text-slate-400" dir="ltr">
                {lead.phone ?? "-"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  {lead.status ?? "-"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                  {lead.source ?? "-"}
                </span>
              </div>
            </article>
          ))}

          {scopedLeads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400 md:col-span-2 xl:col-span-3">
              {tx("ط¸â€‍ط·آ§ ط·ع¾ط¸ث†ط·آ¬ط·آ¯ ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾ ط·آ¯ط·آ§ط·آ®ط¸â€‍ ط¸â€،ط·آ°ط·آ§ ط·آ§ط¸â€‍ط¸â€ ط·آ·ط·آ§ط¸â€ڑ.", "No data in this scope.")}
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
