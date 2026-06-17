"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Building2,
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

const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];
const adminRoles: Role[] = ["developer", "admin", "manager"];

const navGroups: NavGroup[] = [
  {
    labelAr: "الرئيسية",
    labelEn: "Overview",
    items: [
      { href: "/dashboard", labelAr: "لوحة التحكم", labelEn: "Dashboard", icon: LayoutDashboard, roles: allRoles },
    ],
  },
  {
    labelAr: "التشغيل",
    labelEn: "Operations",
    items: [
      { href: "/customers", labelAr: "العملاء", labelEn: "Customers", icon: UsersRound, roles: allRoles },
      { href: "/registrations", labelAr: "التسجيلات", labelEn: "Registrations", icon: Receipt, roles: ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"] },
      { href: "/courses", labelAr: "الدورات", labelEn: "Courses", icon: BookOpen, roles: ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"] },
      { href: "/training-centers", labelAr: "مراكز التدريب", labelEn: "Training Centers", icon: Building2, roles: ["developer", "admin", "manager", "data_analyst"] },
    ],
  },
  {
    labelAr: "الإدخال والتوزيع",
    labelEn: "Intake & Assignment",
    items: [
      { href: "/imports", labelAr: "استيراد العملاء", labelEn: "Imports", icon: FileSpreadsheet, roles: ["developer", "admin", "moderator", "marketer"] },
      { href: "/distribution", labelAr: "توزيع العملاء", labelEn: "Distribution", icon: UsersRound, roles: ["developer", "admin", "manager", "moderator"] },
    ],
  },
  {
    labelAr: "التقارير والمالية",
    labelEn: "Reports & Finance",
    items: [
      { href: "/commissions", labelAr: "العمولات والتقارير", labelEn: "Commissions & Reports", icon: BadgeDollarSign, featureKey: "features.commissions.enabled", roles: ["developer", "admin", "manager", "finance", "sales", "data_analyst"] },
      { href: "/invoices", labelAr: "الفواتير القديمة", labelEn: "Legacy Invoices", icon: Receipt, featureKey: "features.invoices.enabled", roles: ["developer", "admin", "finance"] },
    ],
  },
  {
    labelAr: "النظام",
    labelEn: "System",
    items: [
      { href: "/users", labelAr: "المستخدمون والصلاحيات", labelEn: "Users & Roles", icon: UserCog, roles: ["developer", "admin"] },
      { href: "/settings", labelAr: "الإعدادات", labelEn: "Settings", icon: Settings, roles: ["developer", "admin"] },
      { href: "/customize", labelAr: "تخصيص النظام", labelEn: "Customizer", icon: BarChart3, roles: ["developer", "admin"] },
    ],
  },
];

const pageTitles: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  customers: { ar: "العملاء", en: "Customers" },
  registrations: { ar: "التسجيلات", en: "Registrations" },
  courses: { ar: "الدورات", en: "Courses" },
  trainingCenters: { ar: "مراكز التدريب", en: "Training Centers" },
  imports: { ar: "استيراد العملاء", en: "Imports" },
  distribution: { ar: "توزيع العملاء", en: "Distribution" },
  commissions: { ar: "العمولات والتقارير", en: "Commissions & Reports" },
  invoices: { ar: "الفواتير القديمة", en: "Legacy Invoices" },
  users: { ar: "المستخدمون والصلاحيات", en: "Users & Roles" },
  settings: { ar: "الإعدادات", en: "Settings" },
  customize: { ar: "تخصيص النظام", en: "Customizer" },
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
    developer: { ar: "مطور النظام", en: "Developer" },
    admin: { ar: "المدير العام", en: "General Manager" },
    manager: { ar: "تيم ليدر سيلز", en: "Sales Team Leader" },
    moderator: { ar: "الموديريتور", en: "Moderator" },
    marketer: { ar: "المسوق", en: "Marketer" },
    sales: { ar: "سيلز", en: "Sales" },
    finance: { ar: "مالية / حسابات", en: "Finance" },
    data_analyst: { ar: "محلل بيانات", en: "Data Analyst" },
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
        <p className="text-xs text-emerald-300">{isArabic ? "مساحة العمل النظيفة" : "Clean Workspace"}</p>
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
        {isArabic
          ? "تم إخفاء الصفحات المكررة من القائمة بدون حذف بياناتها. التشغيل الأساسي الآن من العملاء والتسجيلات والمدفوعات."
          : "Legacy duplicate pages are hidden from navigation without deleting their data."}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
        <div className="flex min-h-20 items-center gap-3 px-4 lg:px-6">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 lg:hidden"
            type="button"
            aria-label="menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-emerald-300">
              {isPreviewMode ? (isArabic ? "معاينة مستخدم" : "User preview") : isArabic ? "رؤية النظام" : "System view"}
            </p>
            <h1 className="truncate text-lg font-black md:text-xl">{pageTitle(titleKey)}</h1>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center xl:flex">
            <GlobalScopeSwitcher role={role ?? null} />
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={signOut}
              className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/10 md:flex"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {isArabic ? "تسجيل الخروج" : "Logout"}
            </button>
          </div>
        </div>

        <div className="block border-t border-white/10 px-4 py-3 xl:hidden">
          <GlobalScopeSwitcher role={role ?? null} />
        </div>
      </header>

      {mobileOpen ? <button type="button" aria-label="close menu" onClick={closeMobile} className="fixed inset-0 z-40 bg-black/60 lg:hidden" /> : null}

      <aside
        className={
          "fixed bottom-0 top-0 z-50 w-72 border-white/10 bg-slate-950/95 pt-24 shadow-2xl backdrop-blur-2xl transition-transform duration-300 lg:z-40 lg:block lg:translate-x-0 " +
          (isArabic ? "right-0 border-l " : "left-0 border-r ") +
          (mobileOpen ? "translate-x-0 " : isArabic ? "translate-x-full lg:translate-x-0 " : "-translate-x-full lg:translate-x-0 ")
        }
      >
        {sidebar}
      </aside>

      <main className="min-h-screen pt-32 lg:rtl:pr-72 lg:ltr:pl-72">
        <div className="elitecrm-page-width safe-page px-4 pb-10 lg:px-6">
          <ScopeBanner />
          <AdminEditButton role={role ?? null} />
          <div className="elite-page-enter">{children}</div>
        </div>
      </main>
    </div>
  );
}
