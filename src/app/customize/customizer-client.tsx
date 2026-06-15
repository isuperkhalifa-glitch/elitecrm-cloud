"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  LayoutGrid,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import type { SystemSetting } from "@/lib/settings/defaults";

type Props = {
  pageKey: string;
  initialSettings: SystemSetting[];
};

type SectionKey =
  | "pages"
  | "navigation"
  | "features"
  | "journey"
  | "permissions"
  | "appearance"
  | "advanced";

type PageOption = {
  key: string;
  href: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
};

type FeatureOption = {
  key: string;
  label: string;
  description: string;
  defaultValue: boolean;
};

type ListOption = {
  key: string;
  label: string;
  description: string;
  fallback: string[];
};

type RoleKey = "admin" | "manager" | "moderator" | "sales" | "finance";
type PermissionAction = "view" | "add" | "edit" | "delete" | "assign" | "export";

const pageOptions: PageOption[] = [
  { key: "dashboard", href: "/dashboard", label: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…", defaultTitle: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…", defaultDescription: "ظ…ظ„ط®طµ ط³ط±ظٹط¹ ظ„ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ… ظˆط§ظ„ط¹ظ…ظ„ط§ط،." },
  { key: "customers", href: "/customers", label: "ط§ظ„ط¹ظ…ظ„ط§ط،", defaultTitle: "ط§ظ„ط¹ظ…ظ„ط§ط،", defaultDescription: "طµظپط­ط© ظˆط§ط­ط¯ط© ظ„ظƒظ„ ط§ظ„ط¹ظ…ظ„ط§ط، ظ…ط¹ ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„ ظˆط§ظ„ظ…طھط§ط¨ط¹ط§طھ." },
  { key: "distribution", href: "/distribution", label: "طھظˆط²ظٹط¹ ط§ظ„ط¹ظ…ظ„ط§ط،", defaultTitle: "طھظˆط²ظٹط¹ ط§ظ„ط¹ظ…ظ„ط§ط،", defaultDescription: "طھظˆط²ظٹط¹ ط§ظ„ط¹ظ…ظ„ط§ط، ط¹ظ„ظ‰ ظپط±ظٹظ‚ ط§ظ„ظ…ط¨ظٹط¹ط§طھ." },
  { key: "imports", href: "/imports", label: "ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ط§ط،", defaultTitle: "ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ط§ط،", defaultDescription: "ط§ط³طھظٹط±ط§ط¯ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط، ظ…ظ† ظ…ظ„ظپط§طھ ط®ط§ط±ط¬ظٹط©." },
  { key: "registrations", href: "/registrations", label: "ط§ظ„طھط³ط¬ظٹظ„ط§طھ", defaultTitle: "ط§ظ„طھط³ط¬ظٹظ„ط§طھ", defaultDescription: "ظ…طھط§ط¨ط¹ط© ط§ظ„طھط³ط¬ظٹظ„ ظˆط§ظ„ط¯ظپط¹ ط¨ط´ظƒظ„ ظ…ط¨ط³ط·." },
  { key: "companies", href: "/companies", label: "ط§ظ„ط´ط±ظƒط§طھ", defaultTitle: "ط§ظ„ط´ط±ظƒط§طھ", defaultDescription: "ط¥ط¯ط§ط±ط© ط§ظ„ط´ط±ظƒط§طھ ظˆط§ظ„ط¬ظ‡ط§طھ." },
  { key: "contacts", href: "/contacts", label: "ط¬ظ‡ط§طھ ط§ظ„ط§طھطµط§ظ„", defaultTitle: "ط¬ظ‡ط§طھ ط§ظ„ط§طھطµط§ظ„", defaultDescription: "ط¥ط¯ط§ط±ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„طھظˆط§طµظ„." },
  { key: "users", href: "/users", label: "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†", defaultTitle: "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†", defaultDescription: "ط¥ط¯ط§ط±ط© ط£ط¹ط¶ط§ط، ط§ظ„ظپط±ظٹظ‚ ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ." },
  { key: "settings", href: "/settings", label: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ", defaultTitle: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ", defaultDescription: "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ظ…طھظ‚ط¯ظ…ط©." },
  { key: "leads", href: "/leads", label: "ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ‚ط¯ظٹظ…ط©", defaultTitle: "ط§ظ„ط¹ظ…ظ„ط§ط،", defaultDescription: "طµظپط­ط© ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ‚ط¯ظٹظ…ط©." },
  { key: "my-customers", href: "/my-customers", label: "ط¹ظ…ظ„ط§ط¦ظٹ ط§ظ„ظ‚ط¯ظٹظ…ط©", defaultTitle: "ط¹ظ…ظ„ط§ط¦ظٹ", defaultDescription: "طµظپط­ط© ط¹ظ…ظ„ط§ط¦ظٹ ط§ظ„ظ‚ط¯ظٹظ…ط©." },
  { key: "tasks", href: "/tasks", label: "ط§ظ„ظ…ظ‡ط§ظ…", defaultTitle: "ط§ظ„ظ…ظ‡ط§ظ…", defaultDescription: "طµظپط­ط© ط§ظ„ظ…ظ‡ط§ظ… ط§ظ„ظ‚ط¯ظٹظ…ط©." },
  { key: "deals", href: "/deals", label: "ط§ظ„طµظپظ‚ط§طھ", defaultTitle: "ط§ظ„طµظپظ‚ط§طھ", defaultDescription: "طµظپط­ط© ط§ظ„طµظپظ‚ط§طھ ط§ظ„ظ‚ط¯ظٹظ…ط©." },
  { key: "invoices", href: "/invoices", label: "ط§ظ„ظپظˆط§طھظٹط±", defaultTitle: "ط§ظ„ظپظˆط§طھظٹط±", defaultDescription: "طµظپط­ط© ط§ظ„ظپظˆط§طھظٹط± ط§ظ„ظ‚ط¯ظٹظ…ط©." },
  { key: "commissions", href: "/commissions", label: "ط§ظ„ط¹ظ…ظˆظ„ط§طھ", defaultTitle: "ط§ظ„ط¹ظ…ظˆظ„ط§طھ", defaultDescription: "طµظپط­ط© ط§ظ„ط¹ظ…ظˆظ„ط§طھ." },
];

const featureOptions: FeatureOption[] = [
  { key: "features.registrations.enabled", label: "ط§ظ„طھط³ط¬ظٹظ„ط§طھ", description: "ط¥ط¸ظ‡ط§ط± طµظپط­ط© ط§ظ„طھط³ط¬ظٹظ„ط§طھ ظˆط§ط³طھط®ط¯ط§ظ…ظ‡ط§ ط¨ط¯ظ„ ط§ظ„طµظپظ‚ط§طھ ظˆط§ظ„ظپظˆط§طھظٹط±.", defaultValue: true },
  { key: "features.transfers.enabled", label: "طھط­ظˆظٹظ„ ط§ظ„ط¹ظ…ظ„ط§ط،", description: "ط§ظ„ط³ظ…ط§ط­ ط¨طھط­ظˆظٹظ„ ط§ظ„ط¹ظ…ظٹظ„ ظ…ظ† ط³ظٹظ„ط² ط¥ظ„ظ‰ ط³ظٹظ„ط² ط¢ط®ط±.", defaultValue: true },
  { key: "features.notifications.enabled", label: "ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ", description: "طھط´ط؛ظٹظ„ ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„ظ…طھط§ط¨ط¹ط§طھ ظˆط§ظ„طھظ†ط¨ظٹظ‡ط§طھ ط¯ط§ط®ظ„ ط§ظ„ظ†ط¸ط§ظ….", defaultValue: true },
  { key: "features.imports.enabled", label: "ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ط§ط،", description: "ط§ظ„ط³ظ…ط§ط­ ط¨ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ط§ط، ظ…ظ† ظ…ظ„ظپط§طھ ط®ط§ط±ط¬ظٹط©.", defaultValue: true },
  { key: "features.deals.enabled", label: "ط§ظ„طµظپظ‚ط§طھ", description: "ط¥ط¸ظ‡ط§ط± طµظپط­ط© ط§ظ„طµظپظ‚ط§طھ ط§ظ„ظ‚ط¯ظٹظ…ط©.", defaultValue: false },
  { key: "features.invoices.enabled", label: "ط§ظ„ظپظˆط§طھظٹط±", description: "ط¥ط¸ظ‡ط§ط± طµظپط­ط© ط§ظ„ظپظˆط§طھظٹط± ط§ظ„ظ‚ط¯ظٹظ…ط©.", defaultValue: false },
  { key: "features.commissions.enabled", label: "ط§ظ„ط¹ظ…ظˆظ„ط§طھ", description: "ط¥ط¸ظ‡ط§ط± طµظپط­ط© ط§ظ„ط¹ظ…ظˆظ„ط§طھ.", defaultValue: true },
];

const listOptions: ListOption[] = [
  { key: "crm.customer_statuses", label: "ط­ط§ظ„ط§طھ ط§ظ„ط¹ظ…ظٹظ„", description: "ط§ظ„ظ…ط±ط§ط­ظ„ ط§ظ„طھظٹ ظٹظ…ط± ط¨ظ‡ط§ ط§ظ„ط¹ظ…ظٹظ„ ط¯ط§ط®ظ„ طµظپط­ط© ط§ظ„ط¹ظ…ظ„ط§ط،.", fallback: ["interested", "not_interested", "need_offer", "missed", "wrong_number", "paid", "busy"] },
  { key: "crm.lead_types", label: "ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„", description: "طھطµظ†ظٹظپ ظ…طµط¯ط± ط§ظ„ط¹ظ…ظٹظ„ ط£ظˆ ط·ط±ظٹظ‚ط© ط±ط¬ظˆط¹ظ‡ ظ„ظ„ظ†ط¸ط§ظ….", fallback: ["fresh", "retargeted", "redirected"] },
  { key: "crm.priorities", label: "ط§ظ„ط£ظˆظ„ظˆظٹط§طھ", description: "ط¯ط±ط¬ط§طھ ط£ظ‡ظ…ظٹط© ط§ظ„ط¹ظ…ظٹظ„ ط£ظˆ ط§ظ„ظ…طھط§ط¨ط¹ط©.", fallback: ["low", "medium", "high", "urgent"] },
  { key: "crm.payment_statuses", label: "ط­ط§ظ„ط§طھ ط§ظ„ط¯ظپط¹", description: "ط­ط§ظ„ط§طھ ط§ظ„ط¯ظپط¹ ط§ظ„ظ…ط³طھط®ط¯ظ…ط© ظپظٹ ط§ظ„طھط³ط¬ظٹظ„ط§طھ.", fallback: ["unpaid", "partial", "paid", "refunded"] },
  { key: "crm.loss_reasons", label: "ط£ط³ط¨ط§ط¨ ط§ظ„ط±ظپط¶", description: "ط£ط³ط¨ط§ط¨ ط¹ط¯ظ… ط§ظ‡طھظ…ط§ظ… ط§ظ„ط¹ظ…ظٹظ„ ط£ظˆ ط¹ط¯ظ… ط¥ظƒظ…ط§ظ„ ط§ظ„طھط³ط¬ظٹظ„.", fallback: ["price", "timing", "not_ready", "wrong_course", "no_answer"] },
  { key: "crm.courses", label: "ط§ظ„ط¯ظˆط±ط§طھ", description: "ظ‚ط§ط¦ظ…ط© ط§ظ„ط¯ظˆط±ط§طھ ط§ظ„طھظٹ طھط¸ظ‡ط± ظپظٹ ط§ط®طھظٹط§ط±ط§طھ ط§ظ„ط¹ظ…ظٹظ„.", fallback: ["PMP", "CAPM", "RMP", "Power BI", "Excel", "English Club", "AI", "aPHRi"] },
];

const roles: Array<{ key: RoleKey; label: string }> = [
  { key: "admin", label: "ط§ظ„ط£ط¯ظ…ظ†" },
  { key: "manager", label: "ط§ظ„ظ…ط¯ظٹط±" },
  { key: "moderator", label: "ط§ظ„ظ…ظˆط¯ظٹط±ظٹطھظˆط±" },
  { key: "sales", label: "ط§ظ„ط³ظٹظ„ط²" },
  { key: "finance", label: "ط§ظ„ظ…ط§ظ„ظٹط©" },
];

const permissionActions: Array<{ key: PermissionAction; label: string }> = [
  { key: "view", label: "ظٹط±ظ‰" },
  { key: "add", label: "ظٹط¶ظٹظپ" },
  { key: "edit", label: "ظٹط¹ط¯ظ„" },
  { key: "delete", label: "ظٹط­ط°ظپ" },
  { key: "assign", label: "ظٹظˆط²ط¹" },
  { key: "export", label: "ظٹطµط¯ط±" },
];

const sections: Array<{ key: SectionKey; label: string; hint: string; icon: any }> = [
  { key: "pages", label: "ط§ظ„طµظپط­ط§طھ", hint: "ط§ط®طھط§ط± طµظپط­ط© ظˆط¹ط¯ظ„ ط§ط³ظ…ظ‡ط§ ظˆظˆطµظپظ‡ط§.", icon: FileText },
  { key: "navigation", label: "ط§ظ„ظ‚ط§ط¦ظ…ط©", hint: "ط§ط®طھط§ط± ط§ظ„طµظپط­ط§طھ ط§ظ„طھظٹ طھط¸ظ‡ط± ظپظٹ ط§ظ„ظ‚ط§ط¦ظ…ط©.", icon: LayoutGrid },
  { key: "features", label: "ط§ظ„ظ…ظ…ظٹط²ط§طھ", hint: "طھط´ط؛ظٹظ„ ط£ظˆ ط¥ظٹظ‚ط§ظپ ط£ظٹ ط¬ط²ط، ظ…ظ† ط§ظ„ظ†ط¸ط§ظ….", icon: ToggleLeft },
  { key: "journey", label: "ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„", hint: "ط­ط§ظ„ط§طھ ظˆط£ظ†ظˆط§ط¹ ظˆط£ظˆظ„ظˆظٹط§طھ ط¨ط¯ظˆظ† ظƒطھط§ط¨ط© ظƒظˆط¯.", icon: Workflow },
  { key: "permissions", label: "ط§ظ„طµظ„ط§ط­ظٹط§طھ", hint: "ط­ط¯ط¯ ظ…ط§ط°ط§ ظٹظپط¹ظ„ ظƒظ„ ط¯ظˆط±.", icon: ShieldCheck },
  { key: "appearance", label: "ط§ظ„ظ…ط¸ظ‡ط±", hint: "ط§ط®طھظٹط§ط±ط§طھ ط§ظ„ظˆط§ط¬ظ‡ط© ظˆط·ط±ظٹظ‚ط© ط¹ط±ط¶ ط§ظ„ط¹ظ…ظ„ط§ط،.", icon: Palette },
  { key: "advanced", label: "ظ…طھظ‚ط¯ظ…", hint: "ظ…ظپط§طھظٹط­ ظپظ†ظٹط© ط¹ظ†ط¯ ط§ظ„ط­ط§ط¬ط© ظپظ‚ط·.", icon: Settings2Icon },
];

function Settings2Icon(props: any) {
  return <SlidersHorizontal {...props} />;
}

function valueToText(value: unknown) {
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value == null) return "";
  return String(value);
}

function toArray(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  return fallback;
}

function toBool(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

function normalizeSettingValue(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "boolean") return value;
  if (value == null) return "";
  return String(value);
}

export function CustomizerClient({ pageKey, initialSettings }: Props) {
  const [activeSection, setActiveSection] = useState<SectionKey>("pages");
  const [selectedPage, setSelectedPage] = useState(pageKey || "customers");
  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
  const [drafts, setDrafts] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(initialSettings.map((setting) => [setting.key, normalizeSettingValue(setting.value)]))
  );
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");

  const selectedPageInfo = pageOptions.find((page) => page.key === selectedPage) ?? pageOptions[1];

  const settingMap = useMemo(() => {
    return new Map(settings.map((setting) => [setting.key, setting]));
  }, [settings]);

  function getSettingValue(key: string, fallback: unknown) {
    if (Object.prototype.hasOwnProperty.call(drafts, key)) return drafts[key];
    const existing = settingMap.get(key);
    if (existing) return existing.value;
    return fallback;
  }

  function setDraft(key: string, value: unknown) {
    setDrafts((current) => ({ ...current, [key]: value }));
  }

  async function saveSetting(key: string, label: string, group: string, value: unknown, description: string) {
    setSavingKey(key);
    setMessage("");

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        label,
        group_name: group,
        value,
        description,
        is_public: true,
      }),
    });

    const result = await response.json();

    if (response.ok && result.setting) {
      const saved = result.setting as SystemSetting;
      setSettings((current) => [
        ...current.filter((item) => item.key !== saved.key),
        saved,
      ]);
      setDraft(saved.key, normalizeSettingValue(saved.value));
      setMessage("طھظ… ط§ظ„ط­ظپط¸ ط¨ظ†ط¬ط§ط­");
    } else {
      setMessage(result.error ?? "طھط¹ط°ط± ط§ظ„ط­ظپط¸");
    }

    setSavingKey("");
  }

  function getPageTitleKey() {
    return "pages." + selectedPage + ".title";
  }

  function getPageDescriptionKey() {
    return "pages." + selectedPage + ".description";
  }

  function getNavigationKey(page: PageOption) {
    return "navigation." + page.key.replace(/\//g, ".") + ".visible";
  }

  function addListItem(list: ListOption) {
    const value = (newItems[list.key] ?? "").trim();
    if (!value) return;

    const current = toArray(getSettingValue(list.key, list.fallback), list.fallback);
    if (current.includes(value)) return;

    setDraft(list.key, [...current, value]);
    setNewItems((items) => ({ ...items, [list.key]: "" }));
  }

  function removeListItem(list: ListOption, value: string) {
    const current = toArray(getSettingValue(list.key, list.fallback), list.fallback);
    setDraft(list.key, current.filter((item) => item !== value));
  }

  return (
    <div className="space-y-5">
      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-300">No-Code WordPress Customizer</p>
            <h1 className="mt-2 text-3xl font-black text-white">طھط®طµظٹطµ ط§ظ„ظ†ط¸ط§ظ… ط¨ط§ظ„ظƒط§ظ…ظ„</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-400">
              ط§ط®طھط§ط± ظˆط¹ط¯ظ„ ظˆط´ط؛ظ„ ظˆط§ظ‚ظپظ„ ظ…ظ† ط؛ظٹط± ظƒطھط§ط¨ط© ظƒظˆط¯ ط£ظˆ ظ…ظپط§طھظٹط­ ظپظ†ظٹط©. ط§ظ„ظƒطھط§ط¨ط© ظ…ط·ظ„ظˆط¨ط© ظپظ‚ط· ظ„ظ„ط£ط³ظ…ط§ط، ظˆط§ظ„ظˆطµظپ.
            </p>
          </div>

          {message ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-black text-white">
            <SlidersHorizontal className="h-4 w-4 text-emerald-300" />
            ط£ظ‚ط³ط§ظ… ط§ظ„طھط®طµظٹطµ
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
                    <span className="block text-sm font-black">{section.label}</span>
                    <span className={active ? "mt-1 block text-xs text-slate-800" : "mt-1 block text-xs text-slate-500"}>
                      {section.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          {activeSection === "pages" ? (
            <div className="space-y-5">
              <Header title="طھط®طµظٹطµ ط§ظ„طµظپط­ط§طھ" hint="ط§ط®طھط§ط± ط§ظ„طµظپط­ط© ظˆط¹ط¯ظ„ ط§ظ„ط§ط³ظ… ظˆط§ظ„ظˆطµظپ ط¨ط³ظ‡ظˆظ„ط©." icon={FileText} />

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
                <label className="text-sm font-bold text-slate-300">ط§ط®طھط§ط± ط§ظ„طµظپط­ط©</label>
                <select
                  value={selectedPage}
                  onChange={(event) => setSelectedPage(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {pageOptions.map((page) => (
                    <option key={page.key} value={page.key}>{page.label}</option>
                  ))}
                </select>
              </div>

              <TextSetting
                label="ط¹ظ†ظˆط§ظ† ط§ظ„طµظپط­ط©"
                hint="ط§ظ„ط§ط³ظ… ط§ظ„ط°ظٹ ظٹط¸ظ‡ط± ظپظٹ ط£ط¹ظ„ظ‰ ط§ظ„طµظپط­ط© ظˆط§ظ„ظ‚ط§ط¦ظ…ط©."
                value={String(getSettingValue(getPageTitleKey(), selectedPageInfo.defaultTitle))}
                onChange={(value) => setDraft(getPageTitleKey(), value)}
                onSave={() => saveSetting(getPageTitleKey(), "ط¹ظ†ظˆط§ظ† " + selectedPageInfo.label, "pages", getSettingValue(getPageTitleKey(), selectedPageInfo.defaultTitle), "ط¹ظ†ظˆط§ظ† ط§ظ„طµظپط­ط©")}
                saving={savingKey === getPageTitleKey()}
              />

              <TextSetting
                label="ظˆطµظپ ط§ظ„طµظپط­ط©"
                hint="ط§ظ„ظ†طµ ط§ظ„ظ…ط®طھطµط± ط§ظ„ط°ظٹ ظٹط´ط±ط­ ظˆط¸ظٹظپط© ط§ظ„طµظپط­ط©."
                multiline
                value={String(getSettingValue(getPageDescriptionKey(), selectedPageInfo.defaultDescription))}
                onChange={(value) => setDraft(getPageDescriptionKey(), value)}
                onSave={() => saveSetting(getPageDescriptionKey(), "ظˆطµظپ " + selectedPageInfo.label, "pages", getSettingValue(getPageDescriptionKey(), selectedPageInfo.defaultDescription), "ظˆطµظپ ط§ظ„طµظپط­ط©")}
                saving={savingKey === getPageDescriptionKey()}
              />
            </div>
          ) : null}

          {activeSection === "navigation" ? (
            <div className="space-y-5">
              <Header title="طھط®طµظٹطµ ط§ظ„ظ‚ط§ط¦ظ…ط©" hint="ط§ط®طھط§ط± ط§ظ„طµظپط­ط§طھ ط§ظ„طھظٹ طھط¸ظ‡ط± ظپظٹ ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط¬ط§ظ†ط¨ظٹط©." icon={LayoutGrid} />

              <div className="grid gap-3 md:grid-cols-2">
                {pageOptions.map((page) => {
                  const key = getNavigationKey(page);
                  const defaultVisible = !["leads", "my-customers", "tasks", "deals", "invoices"].includes(page.key);
                  const value = toBool(getSettingValue(key, defaultVisible), defaultVisible);

                  return (
                    <SwitchCard
                      key={page.key}
                      label={page.label}
                      hint={page.href}
                      value={value}
                      onChange={(next) => {
                        setDraft(key, next);
                        saveSetting(key, "ط¥ط¸ظ‡ط§ط± " + page.label, "navigation", next, "ط¥ط¸ظ‡ط§ط± ط£ظˆ ط¥ط®ظپط§ط، ط§ظ„طµظپط­ط© ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط©");
                      }}
                      saving={savingKey === key}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeSection === "features" ? (
            <div className="space-y-5">
              <Header title="طھط´ط؛ظٹظ„ ظˆط¥ظٹظ‚ط§ظپ ط§ظ„ظ…ظ…ظٹط²ط§طھ" hint="ط§ظ‚ظپظ„ ط£ظٹ ط¬ط²ط، ط؛ظٹط± ظ…ط³طھط®ط¯ظ… ظˆط´ط؛ظ„ظ‡ ظˆظ‚طھ ط§ظ„ط­ط§ط¬ط©." icon={ToggleLeft} />

              <div className="grid gap-3 md:grid-cols-2">
                {featureOptions.map((feature) => {
                  const value = toBool(getSettingValue(feature.key, feature.defaultValue), feature.defaultValue);

                  return (
                    <SwitchCard
                      key={feature.key}
                      label={feature.label}
                      hint={feature.description}
                      value={value}
                      onChange={(next) => {
                        setDraft(feature.key, next);
                        saveSetting(feature.key, feature.label, "features", next, feature.description);
                      }}
                      saving={savingKey === feature.key}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeSection === "journey" ? (
            <div className="space-y-5">
              <Header title="ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„" hint="ط¹ط¯ظ„ ط§ظ„ط­ط§ظ„ط§طھ ظˆط§ظ„ط£ظ†ظˆط§ط¹ ظˆط§ظ„ط¯ظˆط±ط§طھ ظƒط§ط®طھظٹط§ط±ط§طھ ط¬ط§ظ‡ط²ط©." icon={Workflow} />

              {listOptions.map((list) => {
                const items = toArray(getSettingValue(list.key, list.fallback), list.fallback);

                return (
                  <div key={list.key} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
                    <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">{list.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{list.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => saveSetting(list.key, list.label, "crm", items, list.description)}
                        disabled={savingKey === list.key}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        ط­ظپط¸
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-slate-200">
                          {item}
                          <button type="button" onClick={() => removeListItem(list, item)} className="text-red-300 hover:text-red-200">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <input
                        value={newItems[list.key] ?? ""}
                        onChange={(event) => setNewItems((current) => ({ ...current, [list.key]: event.target.value }))}
                        placeholder="ط§ظƒطھط¨ ظ‚ظٹظ…ط© ط¬ط¯ظٹط¯ط©"
                        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => addListItem(list)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 px-4 py-3 text-sm font-black text-emerald-300 hover:bg-emerald-400/10"
                      >
                        <Plus className="h-4 w-4" />
                        ط¥ط¶ط§ظپط©
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeSection === "permissions" ? (
            <div className="space-y-5">
              <Header title="ط§ظ„طµظ„ط§ط­ظٹط§طھ" hint="ط­ط¯ط¯ ظ…ط§ط°ط§ ظٹط³طھط·ظٹط¹ ظƒظ„ ط¯ظˆط± ط£ظ† ظٹظپط¹ظ„ ط¯ط§ط®ظ„ ط§ظ„ظ†ط¸ط§ظ…." icon={ShieldCheck} />

              <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-white/[0.04] text-slate-400">
                    <tr>
                      <th className="p-3 text-start">ط§ظ„ط¯ظˆط±</th>
                      {permissionActions.map((action) => (
                        <th key={action.key} className="p-3 text-center">{action.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.key} className="border-t border-white/10">
                        <td className="p-3 font-black text-white">{role.label}</td>
                        {permissionActions.map((action) => {
                          const key = "permissions." + role.key + "." + action.key;
                          const defaultValue = role.key === "admin" || action.key === "view";
                          const value = toBool(getSettingValue(key, defaultValue), defaultValue);

                          return (
                            <td key={key} className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setDraft(key, !value);
                                  saveSetting(key, role.label + " - " + action.label, "permissions", !value, "طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ†ط¸ط§ظ…");
                                }}
                                className={
                                  "mx-auto flex h-9 w-16 items-center justify-center rounded-full text-xs font-black " +
                                  (value ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-400")
                                }
                              >
                                {value ? "ظ†ط¹ظ…" : "ظ„ط§"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeSection === "appearance" ? (
            <div className="space-y-5">
              <Header title="ط§ظ„ظ…ط¸ظ‡ط± ظˆط·ط±ظٹظ‚ط© ط§ظ„ط¹ط±ط¶" hint="ط§ط®طھط§ط± ط´ظƒظ„ ط§ظ„ظ†ط¸ط§ظ… ط¨ط¯ظˆظ† ظƒطھط§ط¨ط©." icon={Palette} />

              <SelectSetting
                label="ط§ظ„ط«ظٹظ… ط§ظ„ط§ظپطھط±ط§ط¶ظٹ"
                value={String(getSettingValue("appearance.default_theme", "dark"))}
                options={[{ label: "ط¯ط§ظƒظ†", value: "dark" }, { label: "ظپط§طھط­", value: "light" }]}
                onChange={(value) => {
                  setDraft("appearance.default_theme", value);
                  saveSetting("appearance.default_theme", "ط§ظ„ط«ظٹظ… ط§ظ„ط§ظپطھط±ط§ط¶ظٹ", "appearance", value, "ط§ط®طھظٹط§ط± ط§ظ„ظˆط¶ط¹ ط§ظ„ط§ظپطھط±ط§ط¶ظٹ ظ„ظ„ظ†ط¸ط§ظ…");
                }}
              />

              <SelectSetting
                label="ط§ظ„ظ„ط؛ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©"
                value={String(getSettingValue("appearance.default_language", "ar"))}
                options={[{ label: "ط§ظ„ط¹ط±ط¨ظٹط©", value: "ar" }, { label: "English", value: "en" }]}
                onChange={(value) => {
                  setDraft("appearance.default_language", value);
                  saveSetting("appearance.default_language", "ط§ظ„ظ„ط؛ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©", "appearance", value, "ط§ط®طھظٹط§ط± ظ„ط؛ط© ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©");
                }}
              />

              <SelectSetting
                label="ط·ط±ظٹظ‚ط© ط¹ط±ط¶ ط§ظ„ط¹ظ…ظ„ط§ط،"
                value={String(getSettingValue("customers.view_mode", "table"))}
                options={[{ label: "ط¬ط¯ظˆظ„ ط³ط±ظٹط¹", value: "table" }, { label: "ظƒط±ظˆطھ", value: "cards" }]}
                onChange={(value) => {
                  setDraft("customers.view_mode", value);
                  saveSetting("customers.view_mode", "ط·ط±ظٹظ‚ط© ط¹ط±ط¶ ط§ظ„ط¹ظ…ظ„ط§ط،", "appearance", value, "ط§ط®طھظٹط§ط± ط´ظƒظ„ طµظپط­ط© ط§ظ„ط¹ظ…ظ„ط§ط،");
                }}
              />

              <SelectSetting
                label="ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ط§ط، ظپظٹ ط§ظ„طµظپط­ط©"
                value={String(getSettingValue("customers.page_size", "50"))}
                options={[{ label: "25", value: "25" }, { label: "50", value: "50" }, { label: "100", value: "100" }]}
                onChange={(value) => {
                  setDraft("customers.page_size", value);
                  saveSetting("customers.page_size", "ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ط§ط، ظپظٹ ط§ظ„طµظپط­ط©", "appearance", value, "ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ط¸ط§ظ‡ط± ظپظٹ ظƒظ„ طµظپط­ط©");
                }}
              />
            </div>
          ) : null}

          {activeSection === "advanced" ? (
            <div className="space-y-5">
              <Header title="ط¥ط¹ط¯ط§ط¯ط§طھ ظ…طھظ‚ط¯ظ…ط©" hint="ظ„ظ„ط¹ط±ط¶ ظپظ‚ط· ط­طھظ‰ ظ„ط§ ظٹطھظ… ظƒط³ط± ط§ظ„ظ†ط¸ط§ظ… ط¨ط§ظ„ط®ط·ط£." icon={SlidersHorizontal} />

              <div className="space-y-3">
                {settings.map((setting) => (
                  <div key={setting.key} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{setting.label || setting.key}</p>
                        <p className="mt-1 text-xs text-slate-500" dir="ltr">{setting.key}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => saveSetting(setting.key, setting.label, setting.group_name, getSettingValue(setting.key, setting.value), setting.description ?? "")}
                        className="rounded-2xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950"
                      >
                        ط­ظپط¸
                      </button>
                    </div>
                    <textarea
                      value={valueToText(getSettingValue(setting.key, setting.value))}
                      onChange={(event) => setDraft(setting.key, event.target.value)}
                      rows={2}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Header({ title, hint, icon: Icon }: { title: string; hint: string; icon: any }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

function TextSetting({ label, hint, value, onChange, onSave, saving, multiline = false }: { label: string; hint: string; value: string; onChange: (value: string) => void; onSave: () => void; saving: boolean; multiline?: boolean }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
      <h3 className="text-lg font-black text-white">{label}</h3>
      <p className="mt-1 text-sm text-slate-400">{hint}</p>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
      )}
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-60">
          <Save className="h-4 w-4" />
          {saving ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸" : "ط­ظپط¸"}
        </button>
      </div>
    </div>
  );
}

function SwitchCard({ label, hint, value, onChange, saving }: { label: string; hint: string; value: boolean; onChange: (value: boolean) => void; saving?: boolean }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">{label}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          disabled={saving}
          className={
            "relative h-9 w-16 rounded-full transition disabled:opacity-60 " +
            (value ? "bg-emerald-400" : "bg-white/10")
          }
        >
          <span className={"absolute top-1 h-7 w-7 rounded-full bg-white transition " + (value ? "end-1" : "start-1")} />
        </button>
      </div>
      <p className={"mt-3 text-xs font-black " + (value ? "text-emerald-300" : "text-slate-500")}>
        {value ? "ظ…ظپط¹ظ„" : "ظ…طھظˆظ‚ظپ"}
      </p>
    </div>
  );
}

function SelectSetting({ label, value, options, onChange }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
      <label className="text-base font-black text-white">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
