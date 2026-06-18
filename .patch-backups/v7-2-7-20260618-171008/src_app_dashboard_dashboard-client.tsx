"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";
import {
  BadgeDollarSign,
  Banknote,
  BookOpen,
  Building2,
  CalendarClock,
  FileSpreadsheet,
  Receipt,
  Route,
  ShieldCheck,
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

function normalizeRole(role?: string | null) {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
  if (role === "finance") return "finance";
  if (role === "data_analyst") return "data_analyst";
  return "sales";
}

export function DashboardClient({
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

  function money(value: number | string | null) {
    return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  const selectedCompanyName = companies.find((company) => company.id === scope.targetId)?.name ?? scope.targetName;

  const scopedLeads =
    scope.mode === "user"
      ? leads.filter((lead) => lead.owner_id === scope.targetId)
      : scope.mode === "company"
        ? leads.filter((lead) =>
            selectedCompanyName ? (lead.company_name ?? "").toLowerCase().includes(selectedCompanyName.toLowerCase()) : false
          )
        : leads;

  const scopedTasks =
    scope.mode === "user"
      ? tasks.filter((task) => task.owner_id === scope.targetId)
      : scope.mode === "company"
        ? tasks.filter((task) => task.related_type === "company" && task.related_id === scope.targetId)
        : tasks;

  const scopedDeals =
    scope.mode === "user"
      ? deals.filter((deal) => deal.owner_id === scope.targetId)
      : scope.mode === "company"
        ? deals.filter((deal) => deal.company_id === scope.targetId)
        : deals;

  const scopedInvoices =
    scope.mode === "user"
      ? invoices.filter((invoice) => invoice.owner_id === scope.targetId)
      : scope.mode === "company"
        ? invoices.filter((invoice) => invoice.company_id === scope.targetId)
        : invoices;

  const scopedCommissions =
    scope.mode === "user"
      ? commissions.filter((commission) => commission.sales_id === scope.targetId)
      : scope.mode === "company"
        ? commissions.filter((commission) => commission.company_id === scope.targetId)
        : commissions;

  const previewRole =
    scope.mode === "user" && scope.previewMode === "selected" && scope.targetRole
      ? normalizeRole(scope.targetRole)
      : normalizeRole(role);

  const todayTasks = scopedTasks.filter((task) => isToday(task.due_date));
  const overdueTasks = scopedTasks.filter((task) => isOverdue(task.due_date));
  const paidRevenue = scopedInvoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);
  const dueCommissionAmount = scopedCommissions
    .filter((commission) => commission.status === "due")
    .reduce((sum, commission) => sum + Number(commission.commission_amount ?? 0), 0);

  const activeUsers = profiles.filter((profile) => profile.is_active !== false).length;
  const canImport = ["developer", "admin", "moderator", "marketer"].includes(previewRole);
  const canDistribute = ["developer", "admin", "manager", "moderator"].includes(previewRole);
  const canSeeMoney = ["developer", "admin", "manager", "finance", "data_analyst"].includes(previewRole);

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

  return (
    <AppShell titleKey="dashboard" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-emerald-300">
              {tx("تشغيل مبسط للنظام بدون صفحات مكررة.", "A simplified operating view without duplicate pages.")}
            </p>
            <h1 className="mt-1 text-3xl font-black text-white">
              {scope.mode === "all" ? tx("لوحة التحكم", "Dashboard") : `${tx("لوحة التحكم", "Dashboard")} — ${scope.targetName ?? ""}`}
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              {scope.mode === "user"
                ? tx("أنت تشاهد النظام حسب المستخدم المختار.", "You are viewing the system as the selected user.")
                : scope.mode === "company"
                  ? tx("أنت تشاهد بيانات مركز التدريب المختار.", "You are viewing the selected training center.")
                  : tx("أنت تشاهد كل النظام.", "You are viewing the whole system.")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              {scope.mode === "all" ? tx("كل النظام", "All system") : scope.mode === "user" ? tx("كمستخدم", "As user") : tx("مركز تدريب", "Training center")}
            </span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-300">
              {previewRole}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={tx("العملاء", "Customers")} value={scopedLeads.length} icon={UsersRound} />
        <StatCard title={tx("متابعات اليوم", "Today follow-ups")} value={todayTasks.length} icon={CalendarClock} tone="blue" />
        <StatCard title={tx("متابعات متأخرة", "Overdue follow-ups")} value={overdueTasks.length} icon={CalendarClock} tone="red" />
        <StatCard title={tx("المدفوعات المحصلة", "Collected payments")} value={money(paidRevenue)} icon={Banknote} tone="green" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={tx("الدورات / الفرص", "Courses / opportunities")} value={scopedDeals.length} icon={BookOpen} />
        <StatCard title={tx("المستخدمون النشطون", "Active users")} value={activeUsers} icon={ShieldCheck} tone="green" />
        <StatCard title={tx("مراكز التدريب", "Training centers")} value={companies.length} icon={Building2} tone="blue" />
        <StatCard title={tx("عمولات مستحقة", "Due commissions")} value={money(dueCommissionAmount)} icon={BadgeDollarSign} tone="yellow" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-emerald-300">{tx("مسار التشغيل", "Operating flow")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">
            {tx("النظام الآن أبسط", "The system is simpler now")}
          </h2>

          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
            <p>1. {tx("العميل يدخل من الاستيراد أو الإضافة اليدوية.", "Customer enters from import or manual entry.")}</p>
            <p>2. {tx("يتم توزيعه على السيلز.", "Customer is assigned to sales.")}</p>
            <p>3. {tx("السيلز يتابع ويسجل العميل في دورة.", "Sales follows up and registers the customer in a course.")}</p>
            <p>4. {tx("المالية تراجع المدفوعات والعمولات.", "Finance reviews payments and commissions.")}</p>
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-emerald-300">{tx("إجراءات سريعة", "Quick actions")}</p>
          <h2 className="mt-1 text-2xl font-black text-white">
            {tx("ادخل للصفحة المناسبة مباشرة", "Go directly to the right page")}
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <QuickAction href="/customers" title={tx("العملاء", "Customers")} description={tx("كل العملاء والمتابعات من مكان واحد.", "All customers and follow-ups in one place.")} icon={UsersRound} />
            <QuickAction href="/registrations" title={tx("التسجيلات والمدفوعات", "Registrations & Payments")} description={tx("تسجيل العميل ومراجعة الدفع.", "Register customers and review payments.")} icon={Receipt} />
            <QuickAction href="/courses" title={tx("الدورات", "Courses")} description={tx("إدارة الدورات المرتبطة بالمراكز.", "Manage center-linked courses.")} icon={BookOpen} />
            {canSeeMoney ? <QuickAction href="/commissions" title={tx("العمولات والتقارير", "Commissions & Reports")} description={tx("مراجعة العمولة والأداء.", "Review commission and performance.")} icon={BadgeDollarSign} /> : null}
            {canImport ? <QuickAction href="/imports" title={tx("استيراد العملاء", "Customer Import")} description={tx("رفع ملفات العملاء وتنظيف البيانات.", "Upload customer files and clean data.")} icon={FileSpreadsheet} /> : null}
            {canDistribute ? <QuickAction href="/distribution" title={tx("توزيع العملاء", "Customer Distribution")} description={tx("توزيع العملاء على الفريق.", "Assign customers to the team.")} icon={Route} /> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
