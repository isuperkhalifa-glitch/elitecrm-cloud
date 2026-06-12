"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
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
  items: { href: string; labelKey: TranslationKey; icon: string }[];
}[] = [
  {
    labelKey: "overview",
    items: [{ href: "/dashboard", labelKey: "dashboard", icon: "◈" }],
  },
  {
    labelKey: "workspace",
    items: [
      { href: "/companies", labelKey: "companies", icon: "▣" },
      { href: "/contacts", labelKey: "contacts", icon: "◎" },
      { href: "/leads", labelKey: "leads", icon: "◇" },
      { href: "/deals", labelKey: "deals", icon: "◆" },
      { href: "/tasks", labelKey: "tasks", icon: "□" },
      { href: "/invoices", labelKey: "invoices", icon: "▤" },
      { href: "/commissions", labelKey: "commissions", icon: "◌" },
    ],
  },
  {
    labelKey: "management",
    items: [
      { href: "/users", labelKey: "users", icon: "◍" },
      { href: "/settings", labelKey: "settings", icon: "⚙" },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel =
    role === "admin" ? t("admin") : role === "sales" ? t("sales") : role ?? "-";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl lg:border-e">
      <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <p className="text-sm text-emerald-300">{t("appName")}</p>
        <h2 className="mt-1 text-xl font-bold text-white">{t("workspace")}</h2>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.labelKey}>
            <p className="mb-2 px-3 text-xs font-semibold text-slate-500">
              {t(group.labelKey)}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                      active
                        ? "bg-emerald-400 text-slate-950"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="w-5 text-center">{item.icon}</span>
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold text-white">{fullName ?? userEmail}</p>
        <p className="mt-1 text-xs text-emerald-300">
          {t("role")}: {roleLabel}
        </p>
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir={dir}>
      <div className="fixed inset-y-0 hidden lg:block">{sidebar}</div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={t("close")}
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <section className="lg:ps-72">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm lg:hidden"
                type="button"
              >
                {t("menu")}
              </button>

              <div>
                <p className="text-xs text-emerald-300">{t("currentPage")}</p>
                <h1 className="text-xl font-bold">{t(titleKey)}</h1>
              </div>
            </div>

            <div className="hidden flex-1 justify-center px-8 md:flex">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-500">
                {t("searchPlaceholder")}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button
                onClick={signOut}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                type="button"
              >
                {t("signOut")}
              </button>
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8">{children}</div>
      </section>
    </main>
  );
}
