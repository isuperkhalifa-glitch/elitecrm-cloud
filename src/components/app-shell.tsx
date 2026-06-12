"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeDollarSign,
  Building2,
  CheckSquare,
  ContactRound,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  UsersRound,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { TranslationKey } from "@/lib/i18n/translations";

type AppShellProps = {
  children: ReactNode;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  titleKey: TranslationKey;
};

const navigationGroups: {
  labelKey: TranslationKey;
  items: { href: string; labelKey: TranslationKey; icon: LucideIcon }[];
}[] = [
  {
    labelKey: "overview",
    items: [{ href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard }],
  },
  {
    labelKey: "workspace",
    items: [
      { href: "/companies", labelKey: "companies", icon: Building2 },
      { href: "/contacts", labelKey: "contacts", icon: ContactRound },
      { href: "/leads", labelKey: "leads", icon: UserRoundPlus },
      { href: "/deals", labelKey: "deals", icon: Handshake },
      { href: "/tasks", labelKey: "tasks", icon: CheckSquare },
      { href: "/invoices", labelKey: "invoices", icon: Receipt },
      { href: "/commissions", labelKey: "commissions", icon: BadgeDollarSign },
    ],
  },
  {
    labelKey: "management",
    items: [
      { href: "/users", labelKey: "users", icon: UsersRound },
      { href: "/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

export function AppShell({
  children,
  userEmail,
  fullName,
  role,
  titleKey,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, dir } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("elitecrm-sidebar-open");
    if (saved === "false") {
      setSidebarOpen(false);
    }
  }, []);

  function toggleSidebar() {
    const nextValue = !sidebarOpen;
    setSidebarOpen(nextValue);
    window.localStorage.setItem("elitecrm-sidebar-open", String(nextValue));
  }

  const roleLabel =
    role === "admin" ? t("admin") : role === "sales" ? t("sales") : role ?? "-";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const sidebarTransform = sidebarOpen
    ? "translateX(0)"
    : dir === "rtl"
      ? "translateX(105%)"
      : "translateX(-105%)";

  const sidebar = (
    <aside className="elite-sidebar flex h-full w-72 flex-col border-white/10 bg-slate-950/90 p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl lg:border-e">
      <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <p className="truncate text-sm text-emerald-300">{t("appName")}</p>
        <h2 className="mt-1 truncate text-xl font-bold text-white">
          {t("workspace")}
        </h2>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden">
        {navigationGroups.map((group) => (
          <div key={group.labelKey}>
            <p className="mb-2 px-3 text-xs font-semibold text-slate-500">
              {t(group.labelKey)}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                        window.localStorage.setItem("elitecrm-sidebar-open", "false");
                      }
                    }}
                    className={`elite-nav-link group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                      active
                        ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 transition ${
                        active
                          ? "text-slate-950"
                          : "text-slate-400 group-hover:text-emerald-300"
                      }`}
                      strokeWidth={2}
                    />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="truncate text-sm font-semibold text-white">
          {fullName ?? userEmail}
        </p>
        <p className="mt-1 text-xs text-emerald-300">
          {t("role")}: {roleLabel}
        </p>
      </div>
    </aside>
  );

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white"
      dir={dir}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_start,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_bottom_end,rgba(56,189,248,0.10),transparent_34%),linear-gradient(135deg,#020617_0%,#07111f_55%,#020617_100%)]" />

      <div
        className="fixed inset-y-0 start-0 z-40 hidden transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block"
        style={{ transform: sidebarTransform }}
      >
        {sidebar}
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={t("close")}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => {
              setSidebarOpen(false);
              window.localStorage.setItem("elitecrm-sidebar-open", "false");
            }}
            type="button"
          />
          <div className="relative h-full w-72 max-w-[86vw] animate-[eliteSlideIn_0.35s_ease-out]">
            {sidebar}
          </div>
        </div>
      ) : null}

      <section
        className={`relative z-10 min-h-screen transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? "lg:ps-72" : "lg:ps-0"
        }`}
      >
        <header
          className={`fixed top-0 end-0 start-0 z-[90] border-b border-white/10 bg-slate-950/95 shadow-lg shadow-black/20 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            sidebarOpen ? "lg:start-72" : "lg:start-0"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="elite-icon-button rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm hover:bg-white/10"
                type="button"
                aria-label={t("menu")}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-xs text-emerald-300">{t("currentPage")}</p>
                <h1 className="truncate text-xl font-bold">{t(titleKey)}</h1>
              </div>
            </div>

            <div className="order-3 w-full md:order-none md:flex md:w-auto md:flex-1 md:justify-center md:px-6">
              <div className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-500 md:max-w-md">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate">{t("searchPlaceholder")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <button
                onClick={signOut}
                className="elite-action-button flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/10 md:px-4"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("signOut")}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="elitecrm-page-width safe-page p-3 pt-28 sm:p-4 sm:pt-28 lg:p-6 lg:pt-28 xl:p-8 xl:pt-28">
          <div className="elite-page-enter">{children}</div>
        </div>
      </section>
    </main>
  );
}


