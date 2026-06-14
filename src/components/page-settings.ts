"use client";

import { useI18n } from "@/components/language-provider";
import { useSystemSettings } from "@/components/system-settings-provider";

export function usePageText(key: string, fallbackAr: string, fallbackEn: string) {
  const { language } = useI18n();
  const { getSetting } = useSystemSettings();

  const fallback = language === "ar" ? fallbackAr : fallbackEn;
  const value = getSetting(key, fallback);

  return typeof value === "string" && value.trim() ? value : fallback;
}

export function useSettingOptions(key: string, fallback: string[]) {
  const { getSetting } = useSystemSettings();
  const value = getSetting(key, fallback);

  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length ? items : fallback;
  }

  if (typeof value === "string") {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : fallback;
  }

  return fallback;
}
