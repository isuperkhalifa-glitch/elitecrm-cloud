"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AdminEditButton } from "@/components/admin-edit-button";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { useScope } from "@/components/scope-provider";
import { createClient } from "@/lib/supabase/client";

type AppShellProps = {
  titleKey: string;
  userEmail: string | null;
  fullName?: string | null;
  role?: string | null;
  children: ReactNode;
};

type Role =
  | "developer"
  | "admin"
  | "manager"
  | "moderator"
  | "marketer"
  | "sales"
  | "finance"
  | "data_analyst";

type NavItem = {
  href: string;
  ar: string;
  en: string;
  icon: LucideIcon;
  roles: Role[];
};

type NavGroup = {
  key: string;
  ar: string;
  en: string;
  icon: LucideIcon;
  roles: Role[];
  items: NavItem[];
};

type Company = {
  id: string;
  name: string;
};

const allRoles: Role[] = [
  "developer",
  "admin",
  "manager",
  "moderator",
  "marketer",
  "sales",
  "finance",
  "data_analyst",
];

const adminRoles: Role[] = ["developer", "admin"];
const salesOpsRoles: Role[] = ["developer", "admin", "manager", "moderator", "sales"];
const reportingRoles: Role[] = ["developer", "admin", "manager", "finance", "data_analyst"];

const navGroups: NavGroup[] = [
  {
    key: "customers",
    ar: "العملاء",
    en: "Customers",
    icon: UsersRound,
    roles: allRoles,
    items: [
      { href: "/customers", ar: "كل العملاء", en: "All customers", icon: UsersRound, roles: allRoles },
      { href: "/distribution", ar: "توزيع العملاء", en: "Distribution", icon: FileSpreadsheet, roles: ["developer", "admin", "manager", "moderator"] },
      { href: "/imports", ar: "استيراد العملاء", en: "Import customers", icon: FileSpreadsheet, roles: ["developer", "admin", "moderator", "marketer"] },
    ],
  },
  {
    key: "sales",
    ar: "المبيعات",
    en: "Sales",
    icon: Receipt,
    roles: salesOpsRoles,
    items: [
      { href: "/registrations", ar: "التسجيلات والمدفوعات", en: "Registrations & payments", icon: Receipt, roles: [...salesOpsRoles, "finance", "data_analyst"] },
      { href: "/commissions", ar: "العمولات", en: "Commissions", icon: BarChart3, roles: ["developer", "admin", "manager", "sales", "finance", "data_analyst"] },
    ],
  },
  {
    key: "academy",
    ar: "الأكاديمية",
    en: "Academy",
    icon: GraduationCap,
    roles: allRoles,
    items: [
      { href: "/training-centers", ar: "مراكز التدريب", en: "Training centers", icon: Building2, roles: ["developer", "admin", "manager", "data_analyst"] },
      { href: "/courses", ar: "الدورات", en: "Courses", icon: BookOpen, roles: allRoles },
    ],
  },
  {
    key: "reports",
    ar: "التقارير",
    en: "Reports",
    icon: BarChart3,
    roles: reportingRoles,
    items: [
      { href: "/reports", ar: "تقارير الأداء", en: "Performance reports", icon: BarChart3, roles: reportingRoles },
      { href: "/commissions", ar: "تقارير العمولات", en: "Commission reports", icon: Receipt, roles: reportingRoles },
    ],
  },
  {
    key: "system",
    ar: "النظام",
    en: "System",
    icon: Settings,
    roles: adminRoles,
    items: [
      { href: "/users", ar: "المستخدمون والصلاحيات", en: "Users & roles", icon: UserCog, roles: adminRoles },
      { href: "/settings", ar: "الإعدادات", en: "Settings", icon: Settings, roles: adminRoles },
      { href: "/customize", ar: "تخصيص النظام", en: "Customize", icon: ShieldCheck, roles: adminRoles },
      { href: "/developer", ar: "مركز المطور", en: "Developer center", icon: Code2, roles: ["developer"] },
    ],
  },
];

const pageTitles: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  calendar: { ar: "التقويم والمتابعات", en: "Calendar & follow-ups" },
  customers: { ar: "العملاء", en: "Customers" },
  registrations: { ar: "التسجيلات والمدفوعات", en: "Registrations & payments" },
  courses: { ar: "الدورات", en: "Courses" },
  trainingCenters: { ar: "مراكز التدريب", en: "Training centers" },
  imports: { ar: "استيراد العملاء", en: "Import customers" },
  distribution: { ar: "توزيع العملاء", en: "Distribution" },
  commissions: { ar: "العمولات", en: "Commissions" },
  reports: { ar: "تقارير الأداء", en: "Performance reports" },
  users: { ar: "المستخدمون والصلاحيات", en: "Users & roles" },
  settings: { ar: "الإعدادات", en: "Settings" },
  customize: { ar: "تخصيص النظام", en: "Customize" },
  developer: { ar: "مركز المطور", en: "Developer center" },
};

function normalizeRole(value?: string | null): Role {
  if (value === "developer") return "developer";
  if (value === "admin") return "admin";
  if (value === "manager") return "manager";
  if (value === "moderator") return "moderator";
  if (value === "marketer") return "marketer";
  if (value === "finance") return "finance";
  if (value === "data_analyst") return "data_analyst";
  return "sales";
}

function roleLabel(role: Role, isArabic: boolean) {
  const labels: Record<Role, { ar: string; en: string }> = {
    developer: { ar: "مطور النظام", en: "Developer" },
    admin: { ar: "المدير العام", en: "General manager" },
    manager: { ar: "تيم ليدر سيلز", en: "Sales team leader" },
    moderator: { ar: "الموديريتور", en: "Moderator" },
    marketer: { ar: "المسوق", en: "Marketer" },
    sales: { ar: "سيلز", en: "Sales" },
    finance: { ar: "مالية / حسابات", en: "Finance" },
    data_analyst: { ar: "محلل بيانات", en: "Data analyst" },
  };
  return isArabic ? labels[role].ar : labels[role].en;
}

export function AppShell({ titleKey, userEmail, fullName, role, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const isArabic = language === "ar";
  const currentRole = normalizeRole(role);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    customers: true,
    sales: true,
    academy: true,
    reports: false,
    system: false,
  });

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;
    async function loadCompanies() {
      const { data } = await supabase.from("companies").select("id,name").order("name");
      if (mounted) setCompanies((data ?? []) as Company[]);
    }
    loadCompanies();
    const savedYear = window.localStorage.getItem("elitecrm-v8-year");
    if (savedYear) setYear(savedYear);
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const visibleGroups = navGroups
    .filter((group) => group.roles.includes(currentRole))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(currentRole)),
    }))
    .filter((group) => group.items.length > 0);

  const sideClass = isArabic ? "right-0 border-l" : "left-0 border-r";
  const contentPadding = sidebarOpen
    ? isArabic
      ? "lg:pr-[230px]"
      : "lg:pl-[230px]"
    : "";
  const hiddenTransform = isArabic ? "translate-x-full" : "-translate-x-full";

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function toggleGroup(key: string) {
    setOpenGroups((current) => ({ ...current, [key]: !current[key] }));
  }

  function changeCompany(companyId: string) {
    if (!companyId) {
      resetScope();
      window.setTimeout(() => router.refresh(), 0);
      return;
    }
    const company = companies.find((item) => item.id === companyId);
    setScope({
      mode: "company",
      targetId: companyId,
      targetName: company?.name ?? "",
      targetRole: "company",
      previewMode: "admin",
    });
    window.setTimeout(() => router.refresh(), 0);
  }

  function changeYear(nextYear: string) {
    setYear(nextYear);
    window.localStorage.setItem("elitecrm-v8-year", nextYear);
  }

  const pageTitle = pageTitles[titleKey] ?? { ar: titleKey, en: titleKey };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#29455f] text-white">
      <div className="border-b border-white/10 bg-white p-4">
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div className="text-center">
            <div className="text-xl font-black tracking-[0.2em] text-[#29455f]">ELITE</div>
            <div className="text-[9px] font-bold tracking-[0.35em] text-emerald-600">CRM</div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-4">
        <p className="truncate text-sm font-bold">{fullName ?? userEmail ?? "-"}</p>
        <p className="mt-1 text-xs text-slate-300">{roleLabel(currentRole, isArabic)}</p>

        <div className="mt-3 grid grid-cols-[1fr_78px] gap-2">
          <select
            value={scope.mode === "company" ? scope.targetId : ""}
            onChange={(event) => changeCompany(event.target.value)}
            className="min-w-0 rounded border border-white/20 bg-[#35536d] px-2 py-2 text-xs text-white outline-none"
          >
            <option value="">{isArabic ? "كل المراكز" : "All centers"}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(event) => changeYear(event.target.value)}
            className="rounded border border-white/20 bg-[#35536d] px-2 py-2 text-xs text-white outline-none"
          >
            {[0, 1, 2].map((offset) => {
              const value = String(new Date().getFullYear() - offset);
              return <option key={value}>{value}</option>;
            })}
          </select>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 border-e-4 px-4 py-3 text-sm font-semibold transition ${
            pathname === "/dashboard"
              ? "border-emerald-400 bg-[#365873]"
              : "border-transparent hover:bg-white/10"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>{isArabic ? "الرئيسية" : "Homepage"}</span>
        </Link>

        <Link
          href="/calendar"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 border-e-4 px-4 py-3 text-sm font-semibold transition ${
            pathname.startsWith("/calendar")
              ? "border-emerald-400 bg-[#365873]"
              : "border-transparent hover:bg-white/10"
          }`}
        >
          <CalendarDays className="h-5 w-5" />
          <span>{isArabic ? "التقويم" : "Calendar"}</span>
        </Link>

        {visibleGroups.map((group) => {
          const Icon = group.icon;
          const expanded = openGroups[group.key] ?? false;
          const groupActive = group.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/")
          );

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className={`flex w-full items-center gap-3 border-e-4 px-4 py-3 text-sm font-semibold transition ${
                  groupActive ? "border-emerald-400 bg-[#365873]" : "border-transparent hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-start">{isArabic ? group.ar : group.en}</span>
                <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded ? (
                <div className="bg-black/10 py-1">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        href={item.href}
                        key={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-8 py-2.5 text-xs transition ${
                          active ? "bg-emerald-400/20 text-emerald-200" : "text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                        <span>{isArabic ? item.ar : item.en}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="v8-shell min-h-screen bg-[#f4f5f7] text-slate-700">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="hidden rounded-md p-2 text-[#29455f] hover:bg-slate-100 lg:inline-flex"
            aria-label={isArabic ? "إظهار أو إخفاء القائمة" : "Toggle sidebar"}
          >
            <Menu className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-md p-2 text-[#29455f] hover:bg-slate-100 lg:hidden"
            aria-label={isArabic ? "فتح القائمة" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-emerald-600">
              {isArabic ? "نظام إدارة المبيعات والتدريب" : "Sales and training management"}
            </p>
            <h1 className="truncate text-lg font-bold text-[#29455f]">
              {isArabic ? pageTitle.ar : pageTitle.en}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" className="hidden rounded-md p-2 text-[#29455f] hover:bg-slate-100 md:inline-flex">
              <Mail className="h-5 w-5" />
            </button>
            <NotificationBell />
            <ThemeToggle />
            <LanguageToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[#29455f] hover:bg-slate-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  <UserCog className="h-4 w-4" />
                </div>
                <span className="hidden max-w-32 truncate md:block">{fullName ?? userEmail ?? "-"}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {accountOpen ? (
                <div className={`absolute top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl ${isArabic ? "left-0" : "right-0"}`}>
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-bold">{fullName ?? userEmail ?? "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{roleLabel(currentRole, isArabic)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {isArabic ? "تسجيل الخروج" : "Sign out"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 z-40 hidden w-[230px] pt-16 transition-transform duration-300 lg:block ${sideClass} ${
          sidebarOpen ? "translate-x-0" : hiddenTransform
        }`}
      >
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
          />
          <aside className={`absolute inset-y-0 w-[270px] pt-16 ${sideClass}`}>{sidebar}</aside>
        </div>
      ) : null}

      <main className={`min-h-screen pt-16 transition-[padding] duration-300 ${contentPadding}`}>
        <div className="p-3 md:p-5">
          <AdminEditButton role={role ?? null} />
          {children}
        </div>
      </main>
    </div>
  );
}
