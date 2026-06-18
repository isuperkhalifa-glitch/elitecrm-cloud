"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  UserCog,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AdminEditButton } from "@/components/admin-edit-button";
import { GlobalScopeSwitcher, ScopeBanner } from "@/components/global-scope-switcher";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { NotificationBell } from "@/components/notification-bell";
import { useScope } from "@/components/scope-provider";
import { useSystemSettings } from "@/components/system-settings-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

type AppShellProps = {
  titleKey: string;
  userEmail: string | null;
  fullName?: string | null;
  role?: string | null;
  children: ReactNode;
};

type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";

type NavItem = {
  href: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  roles: Role[];
  featureKey?: string;
};

type NavGroup = {
  labelAr: string;
  labelEn: string;
  items: NavItem[];
};

const ar = {
  overview: "الرئيسية",
  dashboard: "لوحة التحكم",
  operations: "التشغيل",
  customers: "العملاء",
  registrations: "التسجيلات والمدفوعات",
  courses: "الدورات",
  trainingCenters: "مراكز التدريب",
  intake: "الإدخال والتوزيع",
  imports: "استيراد العملاء",
  distribution: "توزيع العملاء",
  reports: "التقارير",
  commissions: "العمولات والتقارير",
  system: "النظام",
  users: "المستخدمون والصلاحيات",
  settings: "الإعدادات",
  customize: "تخصيص النظام",
  developer: "مطور النظام",
  admin: "المدير العام",
  manager: "تيم ليدر سيلز",
  moderator: "الموديريتور",
  marketer: "المسوق",
  sales: "سيلز",
  finance: "مالية / حسابات",
  dataAnalyst: "محلل بيانات",
  workspace: "مساحة العمل",
  userPreview: "معاينة مستخدم",
  systemView: "رؤية النظام",
  closeSidebar: "إغلاق القائمة",
  openSidebar: "فتح القائمة",
  hideSidebar: "إخفاء القائمة",
  showSidebar: "إظهار القائمة",
  logout: "تسجيل الخروج",
  legacyNote: "تم إخفاء الصفحات المكررة من القائمة بدون حذف بياناتها. التشغيل الأساسي الآن من العملاء والتسجيلات والمدفوعات.",
};

const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];
const adminRoles: Role[] = ["developer", "admin"];
const operationsRoles: Role[] = ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"];
const intakeRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer"];

const navGroups: NavGroup[] = [
  {
    labelAr: ar.overview,
    labelEn: "Overview",
    items: [
      { href: "/dashboard", labelAr: ar.dashboard, labelEn: "Dashboard", icon: LayoutDashboard, roles: allRoles },
    ],
  },
  {
    labelAr: ar.operations,
    labelEn: "Operations",
    items: [
      { href: "/customers", labelAr: ar.customers, labelEn: "Customers", icon: UsersRound, roles: allRoles },
      { href: "/registrations", labelAr: ar.registrations, labelEn: "Registrations & Payments", icon: Receipt, roles: operationsRoles },
      { href: "/courses", labelAr: ar.courses, labelEn: "Courses", icon: BookOpen, roles: ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"] },
      { href: "/training-centers", labelAr: ar.trainingCenters, labelEn: "Training Centers", icon: Building2, roles: ["developer", "admin", "manager", "data_analyst"] },
    ],
  },
  {
    labelAr: ar.intake,
    labelEn: "Intake & Assignment",
    items: [
      { href: "/imports", labelAr: ar.imports, labelEn: "Imports", icon: FileSpreadsheet, roles: ["developer", "admin", "moderator", "marketer"] },
      { href: "/distribution", labelAr: ar.distribution, labelEn: "Distribution", icon: UsersRound, roles: intakeRoles },
    ],
  },
  {
    labelAr: ar.reports,
    labelEn: "Reports",
    items: [
      { href: "/commissions", labelAr: ar.commissions, labelEn: "Commissions & Reports", icon: BadgeDollarSign, featureKey: "features.commissions.enabled", roles: ["developer", "admin", "manager", "finance", "sales", "data_analyst"] },
    ],
  },
  {
    labelAr: ar.system,
    labelEn: "System",
    items: [
      { href: "/users", labelAr: ar.users, labelEn: "Users & Roles", icon: UserCog, roles: adminRoles },
      { href: "/settings", labelAr: ar.settings, labelEn: "Settings", icon: Settings, roles: adminRoles },
      { href: "/customize", labelAr: ar.customize, labelEn: "Customizer", icon: BarChart3, roles: adminRoles },
    ],
  },
];

const pageTitles: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: ar.dashboard, en: "Dashboard" },
  customers: { ar: ar.customers, en: "Customers" },
  registrations: { ar: ar.registrations, en: "Registrations & Payments" },
  courses: { ar: ar.courses, en: "Courses" },
  trainingCenters: { ar: ar.trainingCenters, en: "Training Centers" },
  imports: { ar: ar.imports, en: "Imports" },
  distribution: { ar: ar.distribution, en: "Distribution" },
  commissions: { ar: ar.commissions, en: "Commissions & Reports" },
  users: { ar: ar.users, en: "Users & Roles" },
  settings: { ar: ar.settings, en: "Settings" },
  customize: { ar: ar.customize, en: "Customizer" },
};

function normalizeRole(role?: string | null): Role {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
  if (role === "finance") return "finance";
  if (role === "data_analyst") return "data_analyst";
  return "sales";
}

function roleName(role: Role, isArabic: boolean) {
  const labels: Record<Role, { ar: string; en: string }> = {
    developer: { ar: ar.developer, en: "Developer" },
    admin: { ar: ar.admin, en: "General Manager" },
    manager: { ar: ar.manager, en: "Sales Team Leader" },
    moderator: { ar: ar.moderator, en: "Moderator" },
    marketer: { ar: ar.marketer, en: "Marketer" },
    sales: { ar: ar.sales, en: "Sales" },
    finance: { ar: ar.finance, en: "Finance" },
    data_analyst: { ar: ar.dataAnalyst, en: "Data Analyst" },
  };
  return isArabic ? labels[role].ar : labels[role].en;
}

export function AppShell({ titleKey, userEmail, fullName, role, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useI18n();
  const { scope } = useScope();
  const { getBooleanSetting } = useSystemSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isArabic = language === "ar";
  const realRole = normalizeRole(role);
  const isRealAdmin = adminRoles.includes(realRole);

  const previewRole =
    isRealAdmin && scope.mode === "user" && scope.previewMode === "selected" && scope.targetRole
      ? normalizeRole(scope.targetRole)
      : realRole;

  const isPreviewMode = isRealAdmin && scope.mode === "user" && scope.previewMode === "selected";

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.roles.includes(previewRole) && (!item.featureKey || getBooleanSetting(item.featureKey, true))
      ),
    }))
    .filter((group) => group.items.length > 0);

  function pageTitle(key: string) {
    const entry = pageTitles[key];
    if (entry) return isArabic ? entry.ar : entry.en;
    return t(key);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 pb-6">
      <div className="rounded-[1.7rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
        <p className="text-xs text-emerald-300">{isArabic ? ar.workspace : "Workspace"}</p>
        <h2 className="mt-1 truncate text-lg font-black">{fullName ?? userEmail ?? "-"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{roleName(realRole, isArabic)}</span>
          {isPreviewMode ? (
            <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-300">{roleName(previewRole, isArabic)}</span>
          ) : null}
        </div>
      </div>

      <nav className="space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.labelEn}>
            <p className="mb-2 px-3 text-xs font-bold text-slate-500">{isArabic ? group.labelAr : group.labelEn}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={
                      "elite-nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition " +
                      (active
                        ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white")
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{isArabic ? item.labelAr : item.labelEn}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
        {isArabic ? ar.legacyNote : "Duplicate legacy pages are hidden from navigation without deleting their data."}
      </div>
    </div>
  );

  const sidebarSideClass = isArabic ? "right-0 border-l" : "left-0 border-r";
  const mobileSidebarSideClass = isArabic ? "right-0 border-l" : "left-0 border-r";
  const mainPaddingClass = sidebarCollapsed ? "" : isArabic ? "lg:pr-72" : "lg:pl-72";
  const mobilePanelTransform = mobileOpen ? "translate-x-0" : isArabic ? "translate-x-full" : "-translate-x-full";

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
        <div className="flex min-h-20 items-center gap-3 px-4 lg:px-6">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 lg:hidden"
            type="button"
            aria-label={mobileOpen ? (isArabic ? ar.closeSidebar : "Close menu") : (isArabic ? ar.openSidebar : "Open menu")}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 lg:inline-flex"
            type="button"
            title={sidebarCollapsed ? (isArabic ? ar.showSidebar : "Show sidebar") : (isArabic ? ar.hideSidebar : "Hide sidebar")}
            aria-label={sidebarCollapsed ? (isArabic ? ar.showSidebar : "Show sidebar") : (isArabic ? ar.hideSidebar : "Hide sidebar")}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <Menu className="h-5 w-5" /> : isArabic ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-emerald-300">
              {isPreviewMode ? (isArabic ? ar.userPreview : "User preview") : isArabic ? ar.systemView : "System view"}
            </p>
            <h1 className="truncate text-lg font-black md:text-xl">{pageTitle(titleKey)}</h1>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <GlobalScopeSwitcher role={role ?? null} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <NotificationBell />
            <button
              onClick={signOut}
              type="button"
              className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 xl:flex"
            >
              <LogOut className="h-4 w-4" />
              {isArabic ? ar.logout : "Sign out"}
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-3 lg:hidden">
          <GlobalScopeSwitcher role={role ?? null} />
        </div>
      </header>

      {!sidebarCollapsed ? (
        <aside className={`fixed inset-y-0 ${sidebarSideClass} z-40 hidden w-72 bg-slate-950/95 pt-24 backdrop-blur-2xl lg:block`}>
          {sidebar}
        </aside>
      ) : null}

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label={isArabic ? ar.closeSidebar : "Close menu"}
            className="absolute inset-0 bg-black/50"
            type="button"
            onClick={closeMobile}
          />
          <aside className={`absolute inset-y-0 ${mobileSidebarSideClass} w-80 max-w-[86vw] bg-slate-950/95 pt-24 shadow-2xl backdrop-blur-2xl transition-transform ${mobilePanelTransform}`}>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <main className={`min-h-screen pt-24 transition-[padding] duration-300 ${mainPaddingClass}`}>
        <div className="px-4 pb-8 lg:px-6">
          <ScopeBanner />
          <AdminEditButton role={role ?? null} />
          {children}
        </div>
      </main>
    </div>
  );
}
