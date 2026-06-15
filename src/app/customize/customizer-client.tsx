"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  LayoutGrid,
  Palette,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  Workflow,
} from "lucide-react";
import type { SystemSetting } from "@/lib/settings/defaults";

type Props = {
  pageKey: string;
  initialSettings: SystemSetting[];
};

type SectionKey =
  | "page"
  | "features"
  | "journey"
  | "menu"
  | "permissions"
  | "appearance"
  | "advanced";

const L = {
  title: "\u062a\u062e\u0635\u064a\u0635 \u0627\u0644\u0646\u0638\u0627\u0645",
  subtitle:
    "\u0644\u0648\u062d\u0629 \u0633\u0647\u0644\u0629 \u0632\u064a WordPress \u0644\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0648\u0627\u0644\u0645\u0645\u064a\u0632\u0627\u062a \u0648\u0631\u062d\u0644\u0629 \u0627\u0644\u0639\u0645\u064a\u0644.",
  page: "\u0627\u0644\u0635\u0641\u062d\u0629",
  features: "\u0627\u0644\u0645\u0645\u064a\u0632\u0627\u062a",
  journey: "\u0631\u062d\u0644\u0629 \u0627\u0644\u0639\u0645\u064a\u0644",
  menu: "\u0627\u0644\u0642\u0648\u0627\u0626\u0645",
  permissions: "\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a",
  appearance: "\u0627\u0644\u0645\u0638\u0647\u0631",
  advanced: "\u0645\u062a\u0642\u062f\u0645",
  save: "\u062d\u0641\u0638",
  saved: "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638",
  saving: "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638...",
  pageTitle: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0635\u0641\u062d\u0629",
  pageDescription: "\u0648\u0635\u0641 \u0627\u0644\u0635\u0641\u062d\u0629",
  enabled: "\u0645\u0641\u0639\u0644",
  disabled: "\u0645\u062a\u0648\u0642\u0641",
  noItems: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645.",
  oneItemPerLine: "\u0627\u0643\u062a\u0628 \u0643\u0644 \u0642\u064a\u0645\u0629 \u0641\u064a \u0633\u0637\u0631 \u0645\u0633\u062a\u0642\u0644.",
};

const sections: Array<{
  key: SectionKey;
  title: string;
  desc: string;
  icon: any;
}> = [
  {
    key: "page",
    title: L.page,
    desc: "\u0639\u0646\u0648\u0627\u0646 \u0648\u0648\u0635\u0641 \u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629.",
    icon: FileText,
  },
  {
    key: "features",
    title: L.features,
    desc: "\u062a\u0634\u063a\u064a\u0644 \u0648\u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0645\u0648\u062f\u064a\u0648\u0644\u0627\u062a.",
    icon: ToggleLeft,
  },
  {
    key: "journey",
    title: L.journey,
    desc: "\u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0627\u062a.",
    icon: Workflow,
  },
  {
    key: "menu",
    title: L.menu,
    desc: "\u062a\u0631\u062a\u064a\u0628 \u0648\u062a\u0628\u0633\u064a\u0637 \u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645.",
    icon: LayoutGrid,
  },
  {
    key: "permissions",
    title: L.permissions,
    desc: "\u0645\u0627\u0630\u0627 \u064a\u0631\u0649 \u0648\u064a\u0641\u0639\u0644 \u0643\u0644 \u062f\u0648\u0631.",
    icon: ShieldCheck,
  },
  {
    key: "appearance",
    title: L.appearance,
    desc: "\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u0644\u063a\u0629 \u0648\u0627\u0644\u0639\u0631\u0636.",
    icon: Palette,
  },
  {
    key: "advanced",
    title: L.advanced,
    desc: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0641\u0646\u064a\u0629 \u0644\u0644\u0623\u062f\u0645\u0646.",
    icon: Settings2,
  },
];

function valueToText(value: unknown) {
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value == null) return "";
  return String(value);
}

function parseValue(original: unknown, text: string) {
  if (Array.isArray(original)) {
    return text
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof original === "boolean") {
    return text === "true";
  }

  return text;
}

function settingTitle(setting: SystemSetting) {
  if (setting.key.endsWith(".title")) return L.pageTitle;
  if (setting.key.endsWith(".description")) return L.pageDescription;
  return setting.label || setting.key;
}

function isBooleanSetting(setting: SystemSetting) {
  return typeof setting.value === "boolean" || setting.key.includes(".enabled");
}

function belongsToSection(setting: SystemSetting, section: SectionKey, pageKey: string) {
  if (section === "page") return setting.key.startsWith("pages." + pageKey + ".");
  if (section === "features") return setting.key.startsWith("features.");
  if (section === "journey") {
    return (
      setting.key.includes("status") ||
      setting.key.includes("priorit") ||
      setting.key.includes("lead_type") ||
      setting.key.includes("customer")
    );
  }
  if (section === "menu") return setting.key.startsWith("pages.");
  if (section === "permissions") return setting.key.includes("role") || setting.key.includes("permission");
  if (section === "appearance") {
    return (
      setting.key.includes("theme") ||
      setting.key.includes("color") ||
      setting.key.includes("language") ||
      setting.key.includes("appearance")
    );
  }

  return true;
}

export function CustomizerClient({ pageKey, initialSettings }: Props) {
  const [activeSection, setActiveSection] = useState<SectionKey>("page");
  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialSettings.map((setting) => [setting.key, valueToText(setting.value)]))
  );
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");

  const visibleSettings = useMemo(
    () => settings.filter((setting) => belongsToSection(setting, activeSection, pageKey)),
    [settings, activeSection, pageKey]
  );

  async function saveSetting(setting: SystemSetting) {
    setMessage("");
    setSavingKey(setting.key);

    const nextValue = parseValue(setting.value, values[setting.key] ?? "");

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: setting.key,
        label: setting.label,
        group_name: setting.group_name,
        value: nextValue,
        description: setting.description,
        is_public: setting.is_public ?? true,
      }),
    });

    const result = await response.json();

    if (response.ok && result.setting) {
      const saved = result.setting as SystemSetting;
      setSettings((current) =>
        current.map((item) => (item.key === saved.key ? saved : item))
      );
      setValues((current) => ({ ...current, [saved.key]: valueToText(saved.value) }));
      setMessage(L.saved);
    } else {
      setMessage(result.error ?? "\u062a\u0639\u0630\u0631 \u0627\u0644\u062d\u0641\u0638");
    }

    setSavingKey("");
  }

  return (
    <div className="space-y-5">
      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-300">WordPress Style</p>
            <h1 className="mt-2 text-3xl font-black text-white">{L.title}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-400">{L.subtitle}</p>
          </div>

          {message ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-black text-white">
            <SlidersHorizontal className="h-4 w-4 text-emerald-300" />
            \u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u062a\u062e\u0635\u064a\u0635
          </div>

          <div className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.key;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setActiveSection(section.key)}
                  className={
                    "flex w-full items-start gap-3 rounded-2xl border p-3 text-start transition " +
                    (active
                      ? "border-emerald-400/30 bg-emerald-400 text-slate-950"
                      : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10")
                  }
                >
                  <Icon className="mt-1 h-5 w-5 shrink-0" />
                  <span>
                    <span className="block text-sm font-black">{section.title}</span>
                    <span className={active ? "mt-1 block text-xs text-slate-800" : "mt-1 block text-xs text-slate-500"}>
                      {section.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-emerald-300">\u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u062d\u0627\u0644\u064a</p>
              <h2 className="mt-1 text-2xl font-black text-white">
                {sections.find((section) => section.key === activeSection)?.title}
              </h2>
            </div>

            <Eye className="h-5 w-5 text-slate-500" />
          </div>

          <div className="space-y-4">
            {visibleSettings.length ? (
              visibleSettings.map((setting) => (
                <article key={setting.key} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
                  <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-black text-white">{settingTitle(setting)}</p>
                      <p className="mt-1 text-xs text-slate-500" dir="ltr">{setting.key}</p>
                      {setting.description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-400">{setting.description}</p>
                      ) : null}
                    </div>

                    {isBooleanSetting(setting) ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                        {(values[setting.key] ?? "") === "true" ? L.enabled : L.disabled}
                      </span>
                    ) : null}
                  </div>

                  {isBooleanSetting(setting) ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setValues((current) => ({ ...current, [setting.key]: "true" }))}
                        className={
                          "rounded-2xl px-4 py-2 text-sm font-black " +
                          ((values[setting.key] ?? "") === "true"
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-white/10 text-slate-300")
                        }
                      >
                        {L.enabled}
                      </button>

                      <button
                        type="button"
                        onClick={() => setValues((current) => ({ ...current, [setting.key]: "false" }))}
                        className={
                          "rounded-2xl px-4 py-2 text-sm font-black " +
                          ((values[setting.key] ?? "") === "false"
                            ? "bg-red-400 text-slate-950"
                            : "bg-white/10 text-slate-300")
                        }
                      >
                        {L.disabled}
                      </button>
                    </div>
                  ) : Array.isArray(setting.value) ? (
                    <div>
                      <textarea
                        value={values[setting.key] ?? ""}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [setting.key]: event.target.value }))
                        }
                        rows={5}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                      />
                      <p className="mt-2 text-xs text-slate-500">{L.oneItemPerLine}</p>
                    </div>
                  ) : setting.key.endsWith(".description") ? (
                    <textarea
                      value={values[setting.key] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [setting.key]: event.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                    />
                  ) : (
                    <input
                      value={values[setting.key] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [setting.key]: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                    />
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveSetting(setting)}
                      disabled={savingKey === setting.key}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {savingKey === setting.key ? L.saving : L.save}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                {L.noItems}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
