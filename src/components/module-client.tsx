"use client";

import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n/translations";

type ModuleClientProps = {
  titleKey: TranslationKey;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

export function ModuleClient({
  titleKey,
  userEmail,
  fullName,
  role,
}: ModuleClientProps) {
  const { t } = useI18n();

  return (
    <AppShell
      titleKey={titleKey}
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <p className="text-sm text-emerald-300">{t("readyForData")}</p>
        <h2 className="mt-3 text-3xl font-bold">{t(titleKey)}</h2>
        <p className="mt-3 max-w-2xl text-slate-400">{t("comingSoon")}</p>
      </section>
    </AppShell>
  );
}

