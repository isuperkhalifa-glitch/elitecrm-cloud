"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/components/language-provider";

export function LanguageToggle() {
  const { language, toggleLanguage } = useI18n();

  return (
    <button
      onClick={toggleLanguage}
      className="elite-action-button flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
      type="button"
      aria-label={language === "ar" ? "تغيير اللغة" : "Change language"}
      title={language === "ar" ? "تغيير اللغة" : "Change language"}
    >
      <Languages className="h-4 w-4" />
      <span>{language === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
