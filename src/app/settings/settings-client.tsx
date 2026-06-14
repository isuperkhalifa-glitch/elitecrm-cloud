"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  CheckCircle2,
  Database,
  Eye,
  Layers3,
  Loader2,
  Plus,
  Save,
  Search,
  Settings2,
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

function toText(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function pagePrefix(pageKey?: string | null) {
  return pageKey ? `pages.${pageKey}.` : "";
}

function groupLabel(group: string) {
  const labels: Record<string, string> = {
    pages: "الصفحات",
    features: "الخصائص",
    crm: "CRM",
    general: "عام",
    custom: "مخصص",
  };

  return labels[group] ?? group;
}

function settingShortName(row: SettingRow) {
  if (row.key.endsWith(".title")) return "عنوان الصفحة";
  if (row.key.endsWith(".description")) return "وصف الصفحة";
  if (row.key.includes(".enabled")) return "تشغيل / إيقاف";
  return row.label || row.key;
}

export function SettingsClient({
  initialSettings,
  userEmail,
  fullName,
  role,
  pageKey,
}: Props) {
  const prefix = pagePrefix(pageKey);

  const [rows, setRows] = useState<EditableRow[]>(
    initialSettings.map((setting) => ({
      ...setting,
      valueText: toText(setting.value),
    }))
  );

  const [mode, setMode] = useState(pageKey ? "page" : "all");
  const [search, setSearch] = useState("");

  const [newKey, setNewKey] = useState(pageKey ? `${prefix}custom` : "");
  const [newLabel, setNewLabel] = useState("");
  const [newGroup, setNewGroup] = useState(pageKey ? "pages" : "custom");
  const [newValue, setNewValue] = useState('"قيمة جديدة"');

  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visibleRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesMode =
        mode === "all" ||
        (mode === "page" && prefix && row.key.startsWith(prefix)) ||
        (mode === "features" && row.group_name === "features") ||
        (mode === "crm" && row.group_name === "crm") ||
        (mode === "general" && row.group_name === "general");

      const matchesKeyword =
        !keyword ||
        [
          row.key,
          row.label,
          row.group_name,
          row.description,
          row.valueText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesMode && matchesKeyword;
    });
  }, [rows, mode, prefix, search]);

  const groupedRows = useMemo(() => {
    return visibleRows.reduce<Record<string, EditableRow[]>>((acc, row) => {
      const group = row.group_name || "general";
      acc[group] = acc[group] ?? [];
      acc[group].push(row);
      return acc;
    }, {});
  }, [visibleRows]);

  function updateLocalRow(key: string, patch: Partial<EditableRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  }

  async function saveRow(row: EditableRow) {
    setMessage("");
    setError("");
    setSavingKey(row.key);

    let parsedValue: unknown;

    try {
      parsedValue = JSON.parse(row.valueText);
    } catch {
      setError("قيمة JSON غير صحيحة. النصوص لازم تكون بين علامتي تنصيص.");
      setSavingKey("");
      return;
    }

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: row.key,
        label: row.label,
        group_name: row.group_name,
        value: parsedValue,
        description: row.description,
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
        item.key === row.key
          ? { ...saved, valueText: toText(saved.value) }
          : item
      )
    );

    setMessage("تم حفظ الإعداد بنجاح.");
    setSavingKey("");
  }

  async function addSetting() {
    setMessage("");
    setError("");

    if (!newKey.trim() || !newLabel.trim()) {
      setError("اكتب مفتاح الإعداد والاسم.");
      return;
    }

    let parsedValue: unknown;

    try {
      parsedValue = JSON.parse(newValue);
    } catch {
      setError("قيمة JSON غير صحيحة.");
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
        value: parsedValue,
        description: pageKey
          ? "إعداد مخصص لصفحة " + pageKey
          : "إعداد مخصص من لوحة الأدمن",
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

    setNewKey(pageKey ? prefix + "custom" : "");
    setNewLabel("");
    setNewGroup(pageKey ? "pages" : "custom");
    setNewValue('"قيمة جديدة"');
    setMessage("تم إضافة الإعداد.");
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

  return (
    <AppShell
      titleKey="settings"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-emerald-300">لوحة تحكم الأدمن</p>
            <h1 className="text-3xl font-black text-white">إعدادات النظام الشاملة</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              {pageKey
                ? `أنت تعدل إعدادات صفحة: ${pageKey}`
                : "عدّل النصوص والخصائص الأساسية من مكان واحد."}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Database className="h-4 w-4" />
              Admin Only
            </div>
          </div>
        </div>
      </div>

      <section className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {pageKey ? (
              <button
                type="button"
                onClick={() => setMode("page")}
                className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                  mode === "page"
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                إعدادات الصفحة الحالية
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setMode("all")}
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                mode === "all"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              كل النظام
            </button>

            <button
              type="button"
              onClick={() => setMode("features")}
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                mode === "features"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              الخصائص
            </button>

            <button
              type="button"
              onClick={() => setMode("crm")}
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                mode === "crm"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              CRM
            </button>

            <button
              type="button"
              onClick={() => setMode("general")}
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                mode === "general"
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              عام
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 xl:min-w-96">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث في الإعدادات..."
              className="w-full border-none bg-transparent p-0 text-white outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-emerald-300" />
          <h2 className="text-xl font-black text-white">إضافة إعداد متقدم</h2>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_2fr_auto]">
          <input
            value={newKey}
            onChange={(event) => setNewKey(event.target.value)}
            placeholder="مثال: pages.leads.title"
            dir="ltr"
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="اسم الإعداد"
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          <input
            value={newGroup}
            onChange={(event) => setNewGroup(event.target.value)}
            placeholder="المجموعة"
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          <input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder='"قيمة" أو true أو ["a","b"]'
            dir="ltr"
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          <button
            type="button"
            onClick={addSetting}
            disabled={Boolean(savingKey)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </div>
      </section>

      <div className="grid gap-5">
        {Object.entries(groupedRows).map(([group, groupRows]) => (
          <section
            key={group}
            className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {group === "pages" ? <Layers3 className="h-5 w-5 text-sky-300" /> : <Settings2 className="h-5 w-5 text-emerald-300" />}
                <h2 className="text-2xl font-black text-white">{groupLabel(group)}</h2>
              </div>

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                {groupRows.length} إعداد
              </span>
            </div>

            <div className="grid gap-4">
              {groupRows.map((row) => (
                <article
                  key={row.key}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="mb-3 grid gap-3 xl:grid-cols-[1fr_1fr_auto] xl:items-center">
                    <div>
                      <p className="text-xs font-bold text-emerald-300">{settingShortName(row)}</p>
                      <p className="mt-1 text-[11px] text-slate-500" dir="ltr">{row.key}</p>
                      <input
                        value={row.label}
                        onChange={(event) => updateLocalRow(row.key, { label: event.target.value })}
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-bold text-white outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">المجموعة</p>
                      <input
                        value={row.group_name}
                        onChange={(event) => updateLocalRow(row.key, { group_name: event.target.value })}
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveRow(row)}
                        disabled={savingKey === row.key}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
                      >
                        {savingKey === row.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        حفظ
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSetting(row.key)}
                        disabled={savingKey === row.key}
                        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 hover:bg-red-500/15 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={row.valueText}
                    onChange={(event) => updateLocalRow(row.key, { valueText: event.target.value })}
                    rows={2}
                    dir="ltr"
                    className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-400"
                  />

                  <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                    <input
                      value={row.description ?? ""}
                      onChange={(event) => updateLocalRow(row.key, { description: event.target.value })}
                      placeholder="وصف الإعداد"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                    />

                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
                      <Eye className="h-4 w-4" />
                      public
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {visibleRows.length === 0 ? (
          <div className="safe-card rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
            لا توجد إعدادات مطابقة.
          </div>
        ) : null}
      </div>

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
