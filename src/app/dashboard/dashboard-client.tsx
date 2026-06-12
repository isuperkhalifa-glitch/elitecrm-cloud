"use client";

import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { SignOutButton } from "./sign-out-button";

type DashboardClientProps = {
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

export function DashboardClient({ userEmail, fullName, role }: DashboardClientProps) {
  const { t, dir } = useI18n();

  const roleLabel =
    role === "admin" ? t("admin") : role === "sales" ? t("sales") : role ?? "-";

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir={dir}>
      <header className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm text-emerald-400">{t("appName")}</p>
            <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-emerald-100">
          <h2 className="text-xl font-semibold">{t("activeSystem")}</h2>
          <p className="mt-2 text-sm text-emerald-100/80">{t("protectedArea")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">{t("user")}</p>
            <h2 className="mt-2 text-xl font-semibold">{fullName ?? userEmail}</h2>
            <p className="mt-1 text-sm text-emerald-400">
              {t("role")}: {roleLabel}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">{t("companies")}</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">{t("leads")}</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">{t("deals")}</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>
        </div>
      </section>
    </main>
  );
}
