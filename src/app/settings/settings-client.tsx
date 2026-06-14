"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  CheckCircle2,
  FileText,
  Layers3,
  ListChecks,
  Loader2,
  Plus,
  Power,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";

type SettingRow = {
  key: string;
  label: string;
  group_name: string;
  value: unknown;
  description: string | null;
  is_public: boolean | null;
  updated_at: string | null;
};

type EditableRow = SettingRow & {
  valueText: string;
};

type Props = {
  initialSettings: SettingRow[];
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  pageKey?: string | null;
};

type Mode = "pages" | "features" | "crm" | "advanced";

function toText(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? null, null, 2);
}

function parseValue(text: string) {
  const trimmed = text.trim();

  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on", "enabled"].includes(value.toLowerCase());
  }

  return Boolean(value);
}

function toList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function pageSlug(key: string) {
  const match = key.match(/^pages\.([^.]+)\./);
  return match?.[1] ?? "general";
}

function pageField(key: string) {
  if (key.endsWith(".title")) return "title";
  if (key.endsWith(".description")) return "description";
  return "other";
}

function pageName(slug: string) {
  const names: Record<string, string> = {
    dashboard: "لوحة التحكم",
    leads: "العملاء",
    "my-customers": "العملاء المهتمون",
    distribution: "توزيع العملاء",
    registrations: "التسجيلات",
    tasks: "المهام",
    imports: "استيراد العملاء",
    companies: "الشركات",
    contacts: "جهات الاتصال",
    users: "المستخدمون",
    settings: "الإعدادات",
    deals: "الصفقات",
    invoices: "الفواتير",
    commissions: "العمولات",
  };

  return names[slug] ?? slug;
}

function featureName(key: string, label: string) {
  const names: Record<string, string> = {
    "features.deals.enabled": "صفحة الصفقات",
    "features.invoices.enabled": "صفحة الفواتير",
    "features.commissions.enabled": "صفحة العمولات",
    "features.transfers.enabled": "تحويل العملاء بين السيلز",
  };

  return names[key] ?? label;
}

function crmName(key: string, label: string) {
  const names: Record<string, string> = {
    "crm.lead_statuses": "حالات العملاء",
    "crm.customer_statuses": "حالات رحلة العميل",
    "crm.priorities": "الأولويات",
    "crm.payment_statuses": "حالات الدفع",
  };

  return names[key] ?? label;
}

function settingMatches(row: EditableRow, search: string) {
  const keyword = search.trim().toLowerCase();
  if (!keyword) return true;

  return [row.key, row.label, row.group_name, row.description, row.valueText]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

export function SettingsClient({
  initialSettings,
  userEmail,
  fullName,
  role,
  pageKey,
}: Props) {
  const [rows, setRows] = useState<EditableRow[]>(
    initialSettings.map((setting) => ({
      ...setting,
      valueText: toText(setting.value),
    }))
  );

  const [mode, setMode] = useState<Mode>(pageKey ? "pages" : "pages");
  const [search, setSearch] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newKey, setNewKey] = useState(pageKey ? `pages.${pageKey}.custom` : "");
  const [newLabel, setNewLabel] = useState("");
  const [newGroup, setNewGroup] = useState(pageKey ? "pages" : "custom");
  const [newValue, setNewValue] = useState("قيمة جديدة");

  const pageRows = useMemo(() => {
    const filtered = rows.filter(
      (row) =>
        row.group_name === "pages" &&
        row.key.startsWith("pages.") &&
        (!pageKey || row.key.startsWith(`pages.${pageKey}.`)) &&
        settingMatches(row, search)
    );

    return filtered.reduce<Record<string, EditableRow[]>>((acc, row) => {
      const slug = pageSlug(row.key);
      acc[slug] = acc[slug] ?? [];
      acc[slug].push(row);
      return acc;
    }, {});
  }, [rows, pageKey, search]);

  const featureRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (row.group_name === "features" || row.key.startsWith("features.")) &&
          settingMatches(row, search)
      ),
    [rows, search]
  );

  const crmRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (row.group_name === "crm" || row.key.startsWith("crm.")) &&
          settingMatches(row, search)
      ),
    [rows, search]
  );

  const advancedRows = useMemo(
    () => rows.filter((row) => settingMatches(row, search)),
    [rows, search]
  );

  function updateLocalRow(key: string, patch: Partial<EditableRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  async function saveSetting(row: EditableRow, value: unknown, patch: Partial<EditableRow> = {}) {
    setMessage("");
    setError("");
    setSavingKey(row.key);

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: row.key,
        label: patch.label ?? row.label,
        group_name: patch.group_name ?? row.group_name,
        value,
        description: patch.description ?? row.description,
        is_public: row.is_public ?? true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.setting) {
      setError(result.error ?? "تعذر حفظ الإعداد.");
      setSavingKey("");
      return;
    }

    const saved = result.setting as SettingRow;

    setRows((current) =>
      current.map((item) =>
        item.key === row.key ? { ...saved, valueText: toText(saved.value) } : item
      )
    );

    setMessage("تم الحفظ بنجاح.");
    setSavingKey("");
  }

  async function addSetting() {
    setMessage("");
    setError("");

    if (!newKey.trim() || !newLabel.trim()) {
      setError("اكتب اسم الإعداد أولًا.");
      return;
    }

    setSavingKey(newKey);

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: newKey.trim(),
        label: newLabel.trim(),
        group_name: newGroup.trim() || "custom",
        value: parseValue(newValue),
        description: "إعداد مخصص من لوحة التحكم",
        is_public: true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.setting) {
      setError(result.error ?? "تعذر إضافة الإعداد.");
      setSavingKey("");
      return;
    }

    const added = result.setting as SettingRow;

    setRows((current) => [
      ...current.filter((row) => row.key !== added.key),
      { ...added, valueText: toText(added.value) },
    ]);

    setNewKey(pageKey ? `pages.${pageKey}.custom` : "");
    setNewLabel("");
    setNewGroup(pageKey ? "pages" : "custom");
    setNewValue("قيمة جديدة");
    setMessage("تمت إضافة الإعداد.");
    setSavingKey("");
  }

  async function deleteSetting(key: string) {
    setMessage("");
    setError("");
    setSavingKey(key);

    const response = await fetch("/api/admin/settings?key=" + encodeURIComponent(key), {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "تعذر حذف الإعداد.");
      setSavingKey("");
      return;
    }

    setRows((current) => current.filter((row) => row.key !== key));
    setMessage("تم حذف الإعداد.");
    setSavingKey("");
  }

  const tabs = [
    { id: "pages" as const, label: pageKey ? "الصفحة الحالية" : "الصفحات", icon: FileText },
    { id: "features" as const, label: "تشغيل وإيقاف", icon: Power },
    { id: "crm" as const, label: "القوائم والحالات", icon: ListChecks },
    { id: "advanced" as const, label: "متقدم", icon: SlidersHorizontal },
  ];

  return (
    <AppShell
      titleKey="settings"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-300">لوحة تحكم سهلة</p>
            <h1 className="text-3xl font-black text-white">إعدادات النظام</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              عدّل الصفحات، شغّل أو أوقف المميزات، وغيّر حالات العملاء بدون أي كود.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-200">
            للأدمن فقط
          </div>
        </div>
      </div>

      <section className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = mode === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={
                    "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition " +
                    (active
                      ? "bg-emerald-400 text-slate-950"
                      : "border border-white/10 text-slate-300 hover:bg-white/10")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 xl:min-w-96">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الصفحة أو الإعداد..."
              className="w-full border-none bg-transparent p-0 text-white outline-none"
            />
          </div>
        </div>
      </section>

      {mode === "pages" ? (
        <div className="grid gap-4">
          {Object.entries(pageRows).map(([slug, pageSettings]) => {
            const titleRow = pageSettings.find((row) => pageField(row.key) === "title");
            const descriptionRow = pageSettings.find((row) => pageField(row.key) === "description");

            return (
              <section key={slug} className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-sky-300" />
                  <h2 className="text-2xl font-black text-white">{pageName(slug)}</h2>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {titleRow ? (
                    <div>
                      <p className="mb-2 text-sm font-bold text-slate-300">عنوان الصفحة</p>
                      <div className="flex gap-2">
                        <input
                          value={String(titleRow.value ?? "")}
                          onChange={(event) => updateLocalRow(titleRow.key, { value: event.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={() => saveSetting(titleRow, String(titleRow.value ?? ""))}
                          disabled={savingKey === titleRow.key}
                          className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60"
                        >
                          {savingKey === titleRow.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {descriptionRow ? (
                    <div>
                      <p className="mb-2 text-sm font-bold text-slate-300">وصف الصفحة</p>
                      <div className="flex gap-2">
                        <input
                          value={String(descriptionRow.value ?? "")}
                          onChange={(event) => updateLocalRow(descriptionRow.key, { value: event.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={() => saveSetting(descriptionRow, String(descriptionRow.value ?? ""))}
                          disabled={savingKey === descriptionRow.key}
                          className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60"
                        >
                          {savingKey === descriptionRow.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}

          {Object.keys(pageRows).length === 0 ? (
            <div className="safe-card rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
              لا توجد صفحات مطابقة للبحث.
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "features" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {featureRows.map((row) => {
            const enabled = toBoolean(row.value);

            return (
              <article key={row.key} className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white">{featureName(row.key, row.label)}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{row.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => saveSetting(row, !enabled)}
                    disabled={savingKey === row.key}
                    className={
                      "min-w-28 rounded-2xl px-4 py-3 text-sm font-black transition disabled:opacity-60 " +
                      (enabled
                        ? "bg-emerald-400 text-slate-950"
                        : "border border-white/10 bg-slate-950 text-slate-300")
                    }
                  >
                    {savingKey === row.key ? "جاري..." : enabled ? "مفعل" : "متوقف"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {mode === "crm" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {crmRows.map((row) => (
            <article key={row.key} className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4">
                <h2 className="text-xl font-black text-white">{crmName(row.key, row.label)}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">اكتب كل اختيار في سطر منفصل.</p>
              </div>

              <textarea
                value={toList(row.value).join("\n")}
                onChange={(event) =>
                  updateLocalRow(row.key, {
                    value: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
                rows={7}
                className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />

              <button
                type="button"
                onClick={() => saveSetting(row, toList(row.value))}
                disabled={savingKey === row.key}
                className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60"
              >
                {savingKey === row.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ القائمة
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {mode === "advanced" ? (
        <div className="grid gap-5">
          <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-black text-white">إضافة إعداد متقدم</h2>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_2fr_auto]">
              <input value={newKey} onChange={(event) => setNewKey(event.target.value)} placeholder="مفتاح الإعداد" dir="ltr" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="اسم الإعداد" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={newGroup} onChange={(event) => setNewGroup(event.target.value)} placeholder="المجموعة" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={newValue} onChange={(event) => setNewValue(event.target.value)} placeholder="القيمة" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <button type="button" onClick={addSetting} disabled={Boolean(savingKey)} className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60">
                إضافة
              </button>
            </div>
          </section>

          {advancedRows.map((row) => (
            <article key={row.key} className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-3 grid gap-3 xl:grid-cols-[1fr_1fr_auto] xl:items-center">
                <div>
                  <p className="text-xs text-slate-500" dir="ltr">{row.key}</p>
                  <input value={row.label} onChange={(event) => updateLocalRow(row.key, { label: event.target.value })} className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-bold text-white outline-none focus:border-emerald-400" />
                </div>
                <input value={row.group_name} onChange={(event) => updateLocalRow(row.key, { group_name: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveSetting(row, parseValue(row.valueText), row)} disabled={savingKey === row.key} className="rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60">
                    حفظ
                  </button>
                  <button type="button" onClick={() => deleteSetting(row.key)} disabled={savingKey === row.key} className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 disabled:opacity-60">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <textarea value={row.valueText} onChange={(event) => updateLocalRow(row.key, { valueText: event.target.value })} rows={3} dir="ltr" className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-400" />
            </article>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}
    </AppShell>
  );
}
