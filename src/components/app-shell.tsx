"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  Building2,
  CheckSquare,
  ContactRound,
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

type Role = "admin" | "manager" | "moderator" | "sales" | "finance";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  roles: Role[];
  featureKey?: string;
};

type NavGroup = {
  labelAr: string;
  labelEn: string;
  items: NavItem[];
};

const allRoles: Role[] = ["admin", "manager", "moderator", "sales", "finance"];
const previewAdminRoles: Role[] = ["admin", "manager"];

const navGroups: NavGroup[] = [
  {
    labelAr: "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629",
    labelEn: "Overview",
    items: [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard, roles: allRoles },
    ],
  },
  {
    labelAr: "\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644",
    labelEn: "Workspace",
    items: [
      { href: "/my-customers", labelKey: "myCustomers", icon: UsersRound, roles: ["admin", "manager", "sales"] },
      {
        href: "/registrations",
        labelKey: "registrations",
        icon: CheckSquare,
        featureKey: "features.registrations.enabled",
        roles: ["admin", "manager", "sales", "finance"],
      },
      {
        href: "/leads", labelKey: "leads", icon: UsersRound, roles: ["admin", "manager", "moderator", "sales"] },
      { href: "/tasks", labelKey: "tasks", icon: CheckSquare, roles: ["admin", "manager", "sales"] },
      { href: "/deals", labelKey: "deals", icon: BadgeDollarSign, featureKey: "features.deals.enabled", roles: ["admin", "manager", "sales", "finance"] },
    ],
  },
  {
    labelAr: "\u0627\u0644\u0645\u0627\u0644\u064a\u0629",
    labelEn: "Finance",
    items: [
      { href: "/invoices", labelKey: "invoices", icon: Receipt, featureKey: "features.invoices.enabled", roles: ["admin", "manager", "finance", "sales"] },
      { href: "/commissions", labelKey: "commissions", icon: BadgeDollarSign, featureKey: "features.commissions.enabled", roles: ["admin", "manager", "finance", "sales"] },
    ],
  },
  {
    labelAr: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629",
    labelEn: "Admin",
    items: [
      { href: "/distribution", labelKey: "distribution", icon: UsersRound, roles: ["admin", "manager", "moderator"] },
      { href: "/imports", labelKey: "imports", icon: FileSpreadsheet, roles: ["admin", "manager", "moderator"] },
      { href: "/companies", labelKey: "companies", icon: Building2, roles: ["admin", "manager"] },
      { href: "/contacts", labelKey: "contacts", icon: ContactRound, roles: ["admin", "manager"] },
      { href: "/users", labelKey: "users", icon: UserCog, roles: ["admin"] },
      { href: "/settings", labelKey: "settings", icon: Settings, roles: ["admin"] },
    ],
  },
];

function normalizeRole(role?: string | null): Role {
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "finance") return "finance";
  return "sales";
}

function roleName(role: Role, isArabic: boolean) {
  const labels: Record<Role, { ar: string; en: string }> = {
    admin: { ar: "\u0645\u062f\u064a\u0631 \u0627\u0644\u0646\u0638\u0627\u0645", en: "Admin" },
    manager: { ar: "\u0645\u062f\u064a\u0631", en: "Manager" },
    moderator: { ar: "\u0645\u0648\u062f\u064a\u0631\u064a\u062a\u0648\u0631", en: "Moderator" },
    sales: { ar: "\u0633\u064a\u0644\u0632", en: "Sales" },
    finance: { ar: "\u0645\u0627\u0644\u064a\u0629", en: "Finance" },
  };

  return isArabic ? labels[role].ar : labels[role].en;
}

export function AppShell({
  titleKey,
  userEmail,
  fullName,
  role,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useI18n();
  const { scope } = useScope();
  const { getBooleanSetting } = useSystemSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isArabic = language === "ar";
  const realRole = normalizeRole(role);
  const isRealAdmin = previewAdminRoles.includes(realRole);

  const previewRole =
    isRealAdmin &&
    scope.mode === "user" &&
    scope.previewMode === "selected" &&
    scope.targetRole
      ? normalizeRole(scope.targetRole)
      : realRole;

  const isPreviewMode =
    isRealAdmin &&
    scope.mode === "user" &&
    scope.previewMode === "selected";

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.roles.includes(previewRole) &&
          (!item.featureKey || getBooleanSetting(item.featureKey, true))
      ),
    }))
    .filter((group) => group.items.length > 0);

  function label(key: string) {
    try {
      return t(key as never);
    } catch {
      return key;
    }
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
        <p className="text-xs text-emerald-300">
          {isArabic ? "\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644" : "Workspace"}
        </p>
        <h2 className="mt-1 truncate text-lg font-black">
          {fullName ?? userEmail ?? "-"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
            {roleName(realRole, isArabic)}
          </span>

          {isPreviewMode ? (
            <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs text-sky-300">
              {roleName(previewRole, isArabic)}
            </span>
          ) : null}
        </div>
      </div>

      <nav className="space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.labelEn}>
            <p className="mb-2 px-3 text-xs font-bold text-slate-500">
              {isArabic ? group.labelAr : group.labelEn}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");

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
                    <span>{label(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {isPreviewMode ? (
        <div className="mt-auto rounded-[1.5rem] border border-sky-400/20 bg-sky-400/10 p-4 text-sm leading-7 text-sky-100">
          {isArabic
            ? "\u0623\u0646\u062a \u0627\u0644\u0622\u0646 \u062a\u0634\u0627\u0647\u062f \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0648\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0643\u0645\u0627 \u062a\u0638\u0647\u0631 \u0644\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0645\u062e\u062a\u0627\u0631."
            : "You are previewing the menu and permissions as the selected user."}
        </div>
      ) : null}
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
              {isPreviewMode
                ? isArabic
                  ? "\u0645\u0639\u0627\u064a\u0646\u0629 \u0645\u0633\u062a\u062e\u062f\u0645"
                  : "User preview"
                : isArabic
                  ? "\u0631\u0624\u064a\u0629 \u0627\u0644\u0646\u0638\u0627\u0645"
                  : "System view"}
            </p>
            <h1 className="truncate text-lg font-black md:text-xl">
              {label(titleKey)}
            </h1>
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
              {isArabic ? "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c" : "Logout"}
            </button>
          </div>
        </div>

        <div className="block border-t border-white/10 px-4 py-3 xl:hidden">
          <GlobalScopeSwitcher role={role ?? null} />
        </div>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="close menu"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      ) : null}

      <aside
        className={
          "fixed bottom-0 top-0 z-50 w-72 border-white/10 bg-slate-950/95 pt-24 shadow-2xl backdrop-blur-2xl transition-transform duration-300 lg:z-40 lg:block lg:translate-x-0 " +
          (isArabic ? "right-0 border-l " : "left-0 border-r ") +
          (mobileOpen
            ? "translate-x-0 "
            : isArabic
              ? "translate-x-full lg:translate-x-0 "
              : "-translate-x-full lg:translate-x-0 ")
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
