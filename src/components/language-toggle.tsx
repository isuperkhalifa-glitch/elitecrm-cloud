"use client";

import { useI18n } from "@/components/language-provider";

export function LanguageToggle() {
  const { t, toggleLanguage } = useI18n();

  return (
    <button
      onClick={toggleLanguage}
      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
      type="button"
    >
      {t("switchLanguage")}
    </button>
  );
}
