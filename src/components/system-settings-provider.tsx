"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mergeSystemSettings,
  type SystemSetting,
} from "@/lib/settings/defaults";

type SystemSettingsContextValue = {
  settings: SystemSetting[];
  getSetting: (key: string, fallback?: unknown) => unknown;
  getBooleanSetting: (key: string, fallback?: boolean) => boolean;
};

const defaultSettings = mergeSystemSettings([]);

const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(null);

function toMap(settings: SystemSetting[]) {
  return settings.reduce<Record<string, unknown>>((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "off", "disabled"].includes(normalized)) return false;
  }

  return fallback;
}

export function SystemSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSetting[]>(defaultSettings);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/system-settings", { cache: "no-store" });
        const result = await response.json();

        if (!active || !Array.isArray(result.settings)) return;

        setSettings(mergeSystemSettings(result.settings));
      } catch {
        if (active) setSettings(defaultSettings);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const settingsMap = useMemo(() => toMap(settings), [settings]);

  const value = useMemo<SystemSettingsContextValue>(
    () => ({
      settings,
      getSetting(key, fallback = null) {
        return Object.prototype.hasOwnProperty.call(settingsMap, key)
          ? settingsMap[key]
          : fallback;
      },
      getBooleanSetting(key, fallback = true) {
        return normalizeBoolean(
          Object.prototype.hasOwnProperty.call(settingsMap, key)
            ? settingsMap[key]
            : fallback,
          fallback
        );
      },
    }),
    [settings, settingsMap]
  );

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);

  if (!context) {
    throw new Error("Missing SystemSettingsProvider");
  }

  return context;
}
