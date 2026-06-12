"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { language } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const Icon = theme === "dark" ? Sun : Moon;
  const label = language === "ar" ? "تغيير المظهر" : "Change theme";

  return (
    <button
      onClick={toggleTheme}
      className="elite-action-button flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
      type="button"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">
        {language === "ar" ? "مظهر" : "Theme"}
      </span>
    </button>
  );
}
