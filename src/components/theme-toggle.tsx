"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { language } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isArabic = language === "ar";
  const isDark = theme === "dark";

  const currentLabel = isDark
    ? isArabic ? "الوضع الداكن" : "Dark mode"
    : isArabic ? "الوضع الفاتح" : "Light mode";

  const actionLabel = isDark
    ? isArabic ? "التحويل للوضع الفاتح" : "Switch to light mode"
    : isArabic ? "التحويل للوضع الداكن" : "Switch to dark mode";

  return (
    <button
      onClick={toggleTheme}
      className="v8-theme-toggle inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 text-sm font-medium"
      type="button"
      aria-label={actionLabel}
      title={actionLabel}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="hidden lg:inline">{currentLabel}</span>
    </button>
  );
}
