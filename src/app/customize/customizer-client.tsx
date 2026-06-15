"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  LayoutDashboard,
  ListChecks,
  Palette,
  PanelTopOpen,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import type { SystemSetting } from "@/lib/settings/defaults";

type Props = {
  initialSettings: SystemSetting[];
  pageKey: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type SectionKey = "page" | "features" | "journey" | "lists" | "roles" | "appearance" | "advanced";

type EditableSetting = SystemSetting & {
  valueText: string;
};

const sections: { key: SectionKey; title: string; desc: string; icon: any }[] = [
  { key: "page", title: "طھط®طµظٹطµ ط§ظ„طµظپط­ط©", desc: "ط§ظ„ط¹ظ†ظˆط§ظ†طŒ ط§ظ„ظˆطµظپطŒ ظˆط§ظ„ط¸ظ‡ظˆط±", icon: PanelTopOpen },
  { key: "features", title: "طھط´ط؛ظٹظ„ ظˆط¥ظٹظ‚ط§ظپ", desc: "طھط­ظƒظ… ط³ط±ظٹط¹ ظپظٹ ط§ظ„ظ…ظ…ظٹط²ط§طھ", icon: SlidersHorizontal },
  { key: "journey", title: "ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„", desc: "ط§ظ„ط­ط§ظ„ط§طھ ظˆط§ظ„ظ…طھط§ط¨ط¹ط©", icon: ListChecks },
  { key: "lists", title: "ط§ظ„ظ‚ظˆط§ط¦ظ…", desc: "ط§ظ„ط¯ظˆط±ط§طھطŒ ط§ظ„ظ…طµط§ط¯ط±طŒ ط§ظ„ط£ظ†ظˆط§ط¹", icon: LayoutDashboard },
  { key: "roles", title: "ط§ظ„طµظ„ط§ط­ظٹط§طھ", desc: "ظ…ط§ ظٹط¸ظ‡ط± ظ„ظƒظ„ ط¯ظˆط±", icon: ShieldCheck },
  { key: "appearance", title: "ط§ظ„ظ…ط¸ظ‡ط±", desc: "ط§ظ„ظ„ط؛ط© ظˆط§ظ„ط«ظٹظ… ظˆط§ظ„ظˆط§ط¬ظ‡ط©", icon: Palette },
  { key: "advanced", title: "ظ…طھظ‚ط¯ظ…", desc: "ط¥ط¹ط¯ط§ط¯ط§طھ ظپظ†ظٹط© ط¹ظ†ط¯ ط§ظ„ط­ط§ط¬ط©", icon: Eye },
];

const pageNames: Record<string, string> = {
  dashboard: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…",
  customers: "ط§ظ„ط¹ظ…ظ„ط§ط،",
  distribution: "ط§ظ„طھظˆط²ظٹط¹",
  imports: "ط§ظ„ط§ط³طھظٹط±ط§ط¯",
  registrations: "ط§ظ„طھط³ط¬ظٹظ„ط§طھ",
  settings: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ",
  users: "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†",
};

const featureKeys = [
  "features.deals.enabled",
  "features.invoices.enabled",
  "features.commissions.enabled",
  "features.transfers.enabled",
];

const journeyKeys = [
  "crm.customer_statuses",
  "crm.lead_statuses",
  "crm.payment_statuses",
  "crm.priorities",
  "crm.lead_types",
];

const listKeys = [
  "crm.courses",
  "crm.sources",
  "crm.countries",
];

function toText(value: unknown) {
  if (Array.isArray(value)) return value.join("\\n");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value == null) return "";
  return String(value);
}

function parseValue(text: string, original: unknown) {
  if (typeof original === "boolean") return text === "true";
  if (Array.isArray(original)) {
    return text
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return text;
}

function readableKey(key: string) {
  const map: Record<string, string> = {
    "features.deals.enabled": "طھط´ط؛ظٹظ„ ط§ظ„طµظپظ‚ط§طھ",
    "features.invoices.enabled": "طھط´ط؛ظٹظ„ ط§ظ„ظپظˆط§طھظٹط±",
    "features.commissions.enabled": "طھط´ط؛ظٹظ„ ط§ظ„ط¹ظ…ظˆظ„ط§طھ",
    "features.transfers.enabled": "طھط´ط؛ظٹظ„ طھط­ظˆظٹظ„ ط§ظ„ط¹ظ…ظ„ط§ط،",
    "crm.customer_statuses": "ط­ط§ظ„ط§طھ ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„",
    "crm.lead_statuses": "ط­ط§ظ„ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط،",
    "crm.payment_statuses": "ط­ط§ظ„ط§طھ ط§ظ„ط¯ظپط¹",
    "crm.priorities": "ط§ظ„ط£ظˆظ„ظˆظٹط§طھ",
    "crm.lead_types": "ط£ظ†ظˆط§ط¹ ط§ظ„ط¹ظ…ظ„ط§ط،",
    "crm.courses": "ط§ظ„ط¯ظˆط±ط§طھ",
    "crm.sources": "ظ…طµط§ط¯ط± ط§ظ„ط¹ظ…ظ„ط§ط،",
    "crm.countries": "ط£ظƒظˆط§ط¯ ط§ظ„ط¯ظˆظ„",
  };

  if (key.endsWith(".title")) return "ط¹ظ†ظˆط§ظ† ط§ظ„طµظپط­ط©";
  if (key.endsWith(".description")) return "ظˆطµظپ ط§ظ„طµظپط­ط©";
  return map[key] ?? key;
}

function settingDescription(key: string) {
  if (key.endsWith(".title")) return "ظ‡ط°ط§ ط§ظ„ظ†طµ ظٹط¸ظ‡ط± ظƒط¹ظ†ظˆط§ظ† ط±ط¦ظٹط³ظٹ ط¯ط§ط®ظ„ ط§ظ„طµظپط­ط©.";
  if (key.endsWith(".description")) return "ظ‡ط°ط§ ط§ظ„ظ†طµ ظٹط¸ظ‡ط± ظƒظˆطµظپ ظ…ط®طھطµط± طھط­طھ ط¹ظ†ظˆط§ظ† ط§ظ„طµظپط­ط©.";
  if (key.includes("features.")) return "طھط´ط؛ظٹظ„ ط£ظˆ ط¥ظٹظ‚ط§ظپ ظ‡ط°ظ‡ ط§ظ„ظ…ظٹط²ط© ظ…ظ† ط§ظ„ظˆط§ط¬ظ‡ط© ظˆط§ظ„ط±ظˆط§ط¨ط·.";
  if (key.includes("statuses") || key.includes("priorities")) return "ط§ظƒطھط¨ ظƒظ„ ط§ط®طھظٹط§ط± ظپظٹ ط³ط·ط± ظ…ظ†ظپطµظ„.";
  if (key.includes("courses")) return "ط§ظƒطھط¨ ط£ط³ظ…ط§ط، ط§ظ„ط¯ظˆط±ط§طھطŒ ظƒظ„ ط¯ظˆط±ط© ظپظٹ ط³ط·ط±.";
  return "ط¥ط¹ط¯ط§ط¯ ظ‚ط§ط¨ظ„ ظ„ظ„طھط¹ط¯ظٹظ„ ظ…ظ† ظ„ظˆط­ط© ط§ظ„ط£ط¯ظ…ظ†.";
}

function buildMissingSetting(key: string, pageKey: string): EditableSetting {
  const isTitle = key.endsWith(".title");
  const pageName = pageNames[pageKey] ?? pageKey;

  return {
    key,
    label: readableKey(key),
    group_name: key.startsWith("pages.") ? "pages" : key.startsWith("features.") ? "features" : "crm",
    value: isTitle ? pageName : "",
    description: settingDescription(key),
    is_public: true,
    updated_at: null,
    valueText: isTitle ? pageName : "",
  };
}

export function CustomizerClient({
  initialSettings,
  pageKey,
  userEmail,
  fullName,
  role,
}: Props) {
  const [activeSection, setActiveSection] = useState<SectionKey>("page");
  const [settings, setSettings] = useState<EditableSetting[]>(
    initialSettings.map((item) => ({ ...item, valueText: toText(item.value) }))
  );
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const settingsMap = useMemo(() => {
    return settings.reduce<Record<string, EditableSetting>>((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});
  }, [settings]);

  function getSetting(key: string) {
    return settingsMap[key] ?? buildMissingSetting(key, pageKey);
  }

  function updateText(key: string, valueText: string) {
    setSettings((current) => {
      const exists = current.some((item) => item.key === key);
      if (!exists) return [{ ...getSetting(key), valueText }, ...current];
      return current.map((item) => (item.key === key ? { ...item, valueText } : item));
    });
  }

  async function saveSetting(setting: EditableSetting) {
    setError("");
    setMessage("");
    setSavingKey(setting.key);

    try {
      const value = parseValue(setting.valueText, setting.value);
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: setting.key,
          label: setting.label || readableKey(setting.key),
          group_name: setting.group_name || "custom",
          value,
          description: setting.description || settingDescription(setting.key),
          is_public: setting.is_public ?? true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.setting) {
        setError(result.error ?? "طھط¹ط°ط± ط§ظ„ط­ظپط¸.");
        return;
      }

      const saved = result.setting as SystemSetting;
      setSettings((current) => {
        const next = { ...saved, valueText: toText(saved.value) };
        const exists = current.some((item) => item.key === saved.key);
        return exists
          ? current.map((item) => (item.key === saved.key ? next : item))
          : [next, ...current];
      });
      setMessage("طھظ… ط§ظ„ط­ظپط¸ ط¨ظ†ط¬ط§ط­.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "طھط¹ط°ط± ط§ظ„ط­ظپط¸.");
    } finally {
      setSavingKey("");
    }
  }

  async function saveMany(keys: string[]) {
    for (const key of keys) {
      await saveSetting(getSetting(key));
    }
  }

  function SectionButton({ section }: { section: (typeof sections)[number] }) {
    const Icon = section.icon;
    const active = activeSection === section.key;

    return (
      <button
        type="button"
        onClick={() => setActiveSection(section.key)}
        className={
          "flex w-full items-center gap-3 rounded-2xl p-3 text-start transition " +
          (active
            ? "bg-emerald-400 text-slate-950"
            : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10")
        }
      >
        <Icon className="h-5 w-5" />
        <span>
          <span className="block text-sm font-black">{section.title}</span>
          <span className="mt-1 block text-xs opacity-70">{section.desc}</span>
        </span>
      </button>
    );
  }

  function TextControl({ setting }: { setting: EditableSetting }) {
    const multiline = Array.isArray(setting.value) || setting.key.endsWith(".description");

    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-white">{readableKey(setting.key)}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">{settingDescription(setting.key)}</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-400" dir="ltr">
            {setting.key}
          </span>
        </div>

        {multiline ? (
          <textarea
            value={setting.valueText}
            onChange={(event) => updateText(setting.key, event.target.value)}
            rows={Array.isArray(setting.value) ? 7 : 3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
          />
        ) : (
          <input
            value={setting.valueText}
            onChange={(event) => updateText(setting.key, event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
          />
        )}

        <button
          type="button"
          onClick={() => saveSetting(getSetting(setting.key))}
          disabled={savingKey === setting.key}
          className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {savingKey === setting.key ? "ط¬ط§ط± ط§ظ„ط­ظپط¸..." : "ط­ظپط¸"}
        </button>
      </div>
    );
  }

  function ToggleControl({ setting }: { setting: EditableSetting }) {
    const enabled = setting.valueText === "true";

    return (
      <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div>
          <h3 className="font-black text-white">{readableKey(setting.key)}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{settingDescription(setting.key)}</p>
        </div>

        <button
          type="button"
          onClick={async () => {
            const next = enabled ? "false" : "true";
            updateText(setting.key, next);
            await saveSetting({ ...setting, valueText: next });
          }}
          className={
            "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black " +
            (enabled ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300")
          }
        >
          {enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          {enabled ? "ظ…ظپط¹ظ„" : "ظ…طھظˆظ‚ظپ"}
        </button>
      </div>
    );
  }

  const pageTitle = getSetting(`pages.${pageKey}.title`);
  const pageDescription = getSetting(`pages.${pageKey}.description`);

  return (
    <AppShell titleKey="settings" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="space-y-5">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm font-bold text-emerald-300">طھط®طµظٹطµ ط§ظ„ظ†ط¸ط§ظ…</p>
          <h1 className="mt-2 text-3xl font-black text-white">ظ„ظˆط­ط© طھط®طµظٹطµ طھط´ط¨ظ‡ WordPress</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-400">
            ط¹ط¯ظ‘ظ„ ط§ظ„طµظپط­ط§طھطŒ ط§ظ„ظ‚ظˆط§ط¦ظ…طŒ ط§ظ„ط­ط§ظ„ط§طھطŒ ط§ظ„طµظ„ط§ط­ظٹط§طھطŒ ظˆط§ظ„ظ…ظ…ظٹط²ط§طھ ط¨ط¯ظˆظ† ظƒطھط§ط¨ط© JSON ط£ظˆ ظƒظˆط¯.
          </p>

          {message ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
              {error}
            </div>
          ) : null}
        </section>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="safe-card h-max rounded-[2rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="space-y-2">
              {sections.map((section) => (
                <SectionButton key={section.key} section={section} />
              ))}
            </div>
          </aside>

          <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            {activeSection === "page" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-white">طھط®طµظٹطµ طµظپط­ط©: {pageNames[pageKey] ?? pageKey}</h2>
                    <p className="mt-1 text-sm text-slate-400">ط؛ظٹظ‘ط± ظ…ط§ ظٹط¸ظ‡ط± ظ„ظ„ظ…ط³طھط®ط¯ظ… ط¯ط§ط®ظ„ ظ‡ط°ظ‡ ط§ظ„طµظپط­ط©.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveMany([pageTitle.key, pageDescription.key])}
                    className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    ط­ظپط¸ ط§ظ„ظƒظ„
                  </button>
                </div>
                <TextControl setting={pageTitle} />
                <TextControl setting={pageDescription} />
              </div>
            ) : null}

            {activeSection === "features" ? (
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-white">طھط´ط؛ظٹظ„ ظˆط¥ظٹظ‚ط§ظپ ط§ظ„ظ…ظ…ظٹط²ط§طھ</h2>
                <p className="text-sm text-slate-400">ط£ظٹ ظ…ظٹط²ط© طھظ‚ظپظ„ظ‡ط§ طھط®طھظپظٹ ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط© ظˆط§ظ„ط±ط§ط¨ط·.</p>
                {featureKeys.map((key) => (
                  <ToggleControl key={key} setting={getSetting(key)} />
                ))}
              </div>
            ) : null}

            {activeSection === "journey" ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white">ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„</h2>
                <p className="text-sm text-slate-400">ظƒظ„ ط§ط®طھظٹط§ط± ظپظٹ ط³ط·ط± ظ…ظ†ظپطµظ„. ظ‡ط°ظ‡ ط§ظ„ظ‚ظˆط§ط¦ظ… طھط¸ظ‡ط± ظپظٹ طµظپط­ط© ط§ظ„ط¹ظ…ظ„ط§ط،.</p>
                {journeyKeys.map((key) => (
                  <TextControl key={key} setting={getSetting(key)} />
                ))}
              </div>
            ) : null}

            {activeSection === "lists" ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white">ط§ظ„ظ‚ظˆط§ط¦ظ… ط§ظ„ط£ط³ط§ط³ظٹط©</h2>
                <p className="text-sm text-slate-400">ط§ظ„ط¯ظˆط±ط§طھطŒ ط§ظ„ظ…طµط§ط¯ط±طŒ ظˆط£ظƒظˆط§ط¯ ط§ظ„ط¯ظˆظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ط© ظپظٹ ط§ظ„ظ†ط¸ط§ظ….</p>
                {listKeys.map((key) => (
                  <TextControl key={key} setting={getSetting(key)} />
                ))}
              </div>
            ) : null}

            {activeSection === "roles" ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white">ط§ظ„طµظ„ط§ط­ظٹط§طھ</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["Admin", "ظƒظ„ ط´ظٹط،: ط¥ط¹ط¯ط§ط¯ط§طھطŒ ظ…ط³طھط®ط¯ظ…ظٹظ†طŒ ط¹ظ…ظ„ط§ط،طŒ طھظ‚ط§ط±ظٹط±."],
                    ["Manager", "ظ…طھط§ط¨ط¹ط© ط§ظ„طھط´ط؛ظٹظ„ ظˆط§ظ„طھظˆط²ظٹط¹ ط¨ط¯ظˆظ† ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…."],
                    ["Moderator", "ط¥ط¶ط§ظپط© ظˆط§ط³طھظٹط±ط§ط¯ ظˆطھظˆط²ظٹط¹ ط§ظ„ط¹ظ…ظ„ط§ط،."],
                    ["Sales", "ظ…طھط§ط¨ط¹ط© ط¹ظ…ظ„ط§ط¦ظ‡ ظپظ‚ط· ظˆطھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط§طھ."],
                    ["Finance", "ط§ظ„طھط³ط¬ظٹظ„ط§طھ ظˆط§ظ„ظ…ط¯ظپظˆط¹ط§طھ ظˆط§ظ„ط¹ظ…ظˆظ„ط§طھ."],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <h3 className="font-black text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-400">{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
                  طھط¹ط¯ظٹظ„ ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„طھظپطµظٹظ„ظٹ ظ„ظƒظ„ ط²ط± ظ‡ظٹظƒظˆظ† ظپظٹ ظ†ط³ط®ط© ظ„ط§ط­ظ‚ط© ط­طھظ‰ ظ„ط§ ظ†ظƒط³ط± ط§ظ„ط£ظ…ط§ظ† ط§ظ„ط­ط§ظ„ظٹ.
                </p>
              </div>
            ) : null}

            {activeSection === "appearance" ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white">ط§ظ„ظ…ط¸ظ‡ط± ظˆط§ظ„ظ„ط؛ط©</h2>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="font-black text-white">ط§ظ„ظ„ط؛ط©</h3>
                  <p className="mt-2 text-sm text-slate-400">ظٹطھظ… ط§ظ„طھط­ظƒظ… ظپظٹظ‡ط§ ظ…ظ† ط²ط± ط§ظ„ظ„ط؛ط© ظپظٹ ط§ظ„ظ‡ظٹط¯ط±.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="font-black text-white">ط§ظ„ظ…ط¸ظ‡ط±</h3>
                  <p className="mt-2 text-sm text-slate-400">ظٹطھظ… ط§ظ„طھط­ظƒظ… ظپظٹظ‡ ظ…ظ† ط²ط± ط§ظ„ظ…ط¸ظ‡ط± ظپظٹ ط§ظ„ظ‡ظٹط¯ط±.</p>
                </div>
              </div>
            ) : null}

            {activeSection === "advanced" ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white">ظ…طھظ‚ط¯ظ…</h2>
                <p className="text-sm text-slate-400">ظ‡ط°ط§ ط§ظ„ظ‚ط³ظ… ظ„ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظپظ†ظٹط© ظپظ‚ط·.</p>
                {settings
                  .filter((item) => !item.key.startsWith("pages.") && !featureKeys.includes(item.key) && !journeyKeys.includes(item.key) && !listKeys.includes(item.key))
                  .map((setting) => (
                    <TextControl key={setting.key} setting={setting} />
                  ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
