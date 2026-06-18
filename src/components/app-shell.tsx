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

const ar = {
  overview: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
  dashboard: "\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645",
  operations: "\u0627\u0644\u062a\u0634\u063a\u064a\u0644",
  customers: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  registrations: "\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a \u0648\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a",
  courses: "\u0627\u0644\u062f\u0648\u0631\u0627\u062a",
  trainingCenters: "\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062a\u062f\u0631\u064a\u0628",
  intake: "\u0627\u0644\u0625\u062f\u062e\u0627\u0644 \u0648\u0627\u0644\u062a\u0648\u0632\u064a\u0639",
  imports: "\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  distribution: "\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  reports: "\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631",
  commissions: "\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a \u0648\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631",
  system: "\u0627\u0644\u0646\u0638\u0627\u0645",
  users: "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0648\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a",
  settings: "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",
  customize: "\u062a\u062e\u0635\u064a\u0635 \u0627\u0644\u0646\u0638\u0627\u0645",
  developer: "\u0645\u0637\u0648\u0631 \u0627\u0644\u0646\u0638\u0627\u0645",
  admin: "\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645",
  manager: "\u062a\u064a\u0645 \u0644\u064a\u062f\u0631 \u0633\u064a\u0644\u0632",
  moderator: "\u0627\u0644\u0645\u0648\u062f\u064a\u0631\u064a\u062a\u0648\u0631",
  marketer: "\u0627\u0644\u0645\u0633\u0648\u0642",
  sales: "\u0633\u064a\u0644\u0632",
  finance: "\u0645\u0627\u0644\u064a\u0629 / \u062d\u0633\u0627\u0628\u0627\u062a",
  dataAnalyst: "\u0645\u062d\u0644\u0644 \u0628\u064a\u0627\u0646\u0627\u062a",
  workspace: "\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644",
  userPreview: "\u0645\u0639\u0627\u064a\u0646\u0629 \u0645\u0633\u062a\u062e\u062f\u0645",
  systemView: "\u0631\u0624\u064a\u0629 \u0627\u0644\u0646\u0638\u0627\u0645",
  closeSidebar: "\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  openSidebar: "\u0641\u062a\u062d \u0627\u0644\u0642\u0627\u0626\u0645\u0629",
  logout: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
  legacyNote: "\u062a\u0645 \u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0645\u0643\u0631\u0631\u0629 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0628\u062f\u0648\u0646 \u062d\u0630\u0641 \u0628\u064a\u0627\u0646\u0627\u062a\u0647\u0627. \u0627\u0644\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u0627\u0644\u0622\u0646 \u0645\u0646 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a \u0648\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a.",
};

const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];
const adminRoles: Role[] = ["developer", "admin"];
const operationsRoles: Role[] = ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"];
const intakeRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer"];

const navGroups: NavGroup[] = [
  {
    labelAr: ar.overview,
    labelEn: "Overview",
    items: [{ href: "/dashboard", labelAr: ar.dashboard, labelEn: "Dashboard", icon: LayoutDashboard, roles: allRoles }],
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
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

      <aside className="fixed inset-y-0 end-0 z-40 hidden w-72 border-s border-white/10 bg-slate-950/95 pt-24 backdrop-blur-2xl lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/40" type="button" onClick={closeMobile} aria-label={isArabic ? ar.closeSidebar : "Close menu"} />
          <aside className="absolute inset-y-0 end-0 w-80 max-w-[88vw] border-s border-white/10 bg-slate-950 pt-24 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <main className="min-h-screen pt-28 lg:pe-72">
        <div className="px-4 pb-8 lg:px-6">
          <ScopeBanner />
          <AdminEditButton role={role ?? null} />
          {children}
        </div>
      </main>
    </div>
  );
}
