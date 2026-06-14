"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Database, Loader2, Plus, Save, Trash2, XCircle } from "lucide-react";

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
};

function toText(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

export function SettingsClient({
  initialSettings,
  userEmail,
  fullName,
  role,
}: Props) {
  const [rows, setRows] = useState<EditableRow[]>(
    initialSettings.map((setting) => ({
      ...setting,
      valueText: toText(setting.value),
    }))
  );

  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newGroup, setNewGroup] = useState("custom");
  const [newValue, setNewValue] = useState('"قيمة جديدة"');

  const [savingKey, setSavingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const groupedRows = useMemo(() => {
    return rows.reduce<Record<string, EditableRow[]>>((acc, row) => {
      const group = row.group_name || "general";
      acc[group] = acc[group] ?? [];
      acc[group].push(row);
      return acc;
    }, {});
  }, [rows]);

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

    const supabase = createClient();

    const { data, error } = await supabase
      .from("system_settings")
      .upsert(
        {
          key: row.key,
          label: row.label,
          group_name: row.group_name,
          value: parsedValue,
          description: row.description,
          is_public: row.is_public ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select("key,label,group_name,value,description,is_public,updated_at")
      .single();

    if (error || !data) {
      setError(error?.message ?? "تعذر حفظ الإعداد.");
      setSavingKey("");
      return;
    }

    setRows((current) =>
      current.map((item) =>
        item.key === row.key
          ? { ...(data as SettingRow), valueText: toText((data as SettingRow).value) }
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

    const supabase = createClient();

    const { data, error } = await supabase
      .from("system_settings")
      .upsert(
        {
          key: newKey.trim(),
          label: newLabel.trim(),
          group_name: newGroup.trim() || "custom",
          value: parsedValue,
          description: "إعداد مخصص من لوحة الأدمن",
          is_public: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select("key,label,group_name,value,description,is_public,updated_at")
      .single();

    if (error || !data) {
      setError(error?.message ?? "تعذر إضافة الإعداد.");
      setSavingKey("");
      return;
    }

    const added = data as SettingRow;

    setRows((current) => [
      ...current.filter((row) => row.key !== added.key),
      { ...added, valueText: toText(added.value) },
    ]);

    setNewKey("");
    setNewLabel("");
    setNewGroup("custom");
    setNewValue('"قيمة جديدة"');
    setMessage("تم إضافة الإعداد.");
    setSavingKey("");
  }

  async function deleteSetting(key: string) {
    setMessage("");
    setError("");
    setSavingKey(key);

    const supabase = createClient();

    const { error } = await supabase.from("system_settings").delete().eq("key", key);

    if (error) {
      setError(error.message);
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
              هنا تقدر تعدل قيم النظام من قاعدة البيانات. أي قيمة هنا هتبقى أساس للتحكم في الصفحات، الحالات، الخصائص، والأسماء.
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
        <h2 className="mb-4 text-xl font-black text-white">إضافة إعداد جديد</h2>

        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_2fr_auto]">
          <input
            value={newKey}
            onChange={(event) => setNewKey(event.target.value)}
            placeholder="مثال: pages.leads.title"
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
            <h2 className="mb-4 text-2xl font-black text-white">{group}</h2>

            <div className="grid gap-4">
              {groupRows.map((row) => (
                <article
                  key={row.key}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="mb-3 grid gap-3 xl:grid-cols-[1fr_1fr_auto] xl:items-center">
                    <div>
                      <p className="text-xs text-slate-500">{row.key}</p>
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
                    rows={5}
                    dir="ltr"
                    className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-emerald-400"
                  />

                  <input
                    value={row.description ?? ""}
                    onChange={(event) => updateLocalRow(row.key, { description: event.target.value })}
                    placeholder="وصف الإعداد"
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
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
