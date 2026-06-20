"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { useScope, type GlobalScope, type ScopeMode, type ScopePreviewMode } from "@/components/scope-provider";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Company = { id: string; name: string };

export function HeaderScopeSwitcher({ role }: { role?: string | null }) {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const supabase = useMemo(() => createClient(), []);
  const isArabic = language === "ar";
  const canUse = role === "developer" || role === "admin";
  const tx = (ar: string, en: string) => (isArabic ? ar : en);

  useEffect(() => {
    if (!canUse) return;
    let active = true;

    async function loadOptions() {
      const [usersResponse, companiesResponse] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        supabase.from("companies").select("id,name").order("name"),
      ]);

      if (!active) return;
      if (usersResponse.ok) {
        const payload = await usersResponse.json();
        setProfiles(((payload.users ?? []) as Profile[]).filter((item) => item.is_active !== false));
      }
      setCompanies((companiesResponse.data ?? []) as Company[]);
    }

    void loadOptions();
    return () => {
      active = false;
    };
  }, [canUse, supabase]);

  if (!canUse) return null;

  function apply(next: GlobalScope) {
    setScope(next);
    window.setTimeout(() => router.refresh(), 0);
  }

  function changeMode(mode: ScopeMode) {
    if (mode === "all") {
      apply({ mode: "all", targetId: "", targetName: "", targetRole: "", previewMode: "admin" });
      return;
    }

    if (mode === "user") {
      const target = profiles[0];
      if (!target) return;
      apply({
        mode,
        targetId: target.id,
        targetName: target.full_name ?? target.email ?? target.id,
        targetRole: target.role ?? "sales",
        previewMode: "admin",
      });
      return;
    }

    const target = companies[0];
    if (!target) return;
    apply({
      mode,
      targetId: target.id,
      targetName: target.name,
      targetRole: "company",
      previewMode: "admin",
    });
  }

  function changeTarget(targetId: string) {
    if (scope.mode === "user") {
      const target = profiles.find((item) => item.id === targetId);
      if (!target) return;
      apply({
        ...scope,
        targetId,
        targetName: target.full_name ?? target.email ?? target.id,
        targetRole: target.role ?? "sales",
      });
      return;
    }

    const target = companies.find((item) => item.id === targetId);
    if (!target) return;
    apply({ ...scope, targetId, targetName: target.name, targetRole: "company", previewMode: "admin" });
  }

  function clearScope() {
    resetScope();
    window.setTimeout(() => router.refresh(), 0);
  }

  return (
    <div className="hidden max-w-[620px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1.5 xl:flex">
      <Eye className="h-4 w-4 shrink-0 text-emerald-600" />
      <select value={scope.mode} onChange={(event) => changeMode(event.target.value as ScopeMode)} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none">
        <option value="all">{tx("كل النظام", "All system")}</option>
        <option value="user">{tx("مستخدم", "User")}</option>
        <option value="company">{tx("مركز تدريب", "Training center")}</option>
      </select>

      {scope.mode !== "all" ? (
        <select value={scope.targetId} onChange={(event) => changeTarget(event.target.value)} className="max-w-48 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none">
          {scope.mode === "user"
            ? profiles.map((item) => <option key={item.id} value={item.id}>{item.full_name ?? item.email ?? item.id}</option>)
            : companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      ) : null}

      {scope.mode === "user" ? (
        <select value={scope.previewMode} onChange={(event) => apply({ ...scope, previewMode: event.target.value as ScopePreviewMode })} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none">
          <option value="admin">{tx("رؤية الأدمن", "Admin view")}</option>
          <option value="selected">{tx("معاينة المستخدم", "User preview")}</option>
        </select>
      ) : null}

      {scope.mode !== "all" ? (
        <button type="button" onClick={clearScope} className="rounded p-1.5 text-slate-500 hover:bg-white" title={tx("إلغاء النطاق", "Reset scope")}>
          <RotateCcw className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function ActiveScopeBanner() {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, resetScope } = useScope();

  if (scope.mode === "all") return null;

  const isArabic = language === "ar";
  const modeLabel = scope.mode === "user"
    ? (isArabic ? "المستخدم" : "User")
    : (isArabic ? "مركز التدريب" : "Training center");
  const viewLabel = scope.mode === "user" && scope.previewMode === "selected"
    ? (isArabic ? "معاينة المستخدم" : "User preview")
    : (isArabic ? "رؤية الأدمن" : "Admin view");

  function clearScope() {
    resetScope();
    window.setTimeout(() => router.refresh(), 0);
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 md:flex-row md:items-center md:justify-between">
      <p className="min-w-0 truncate text-sm text-slate-700">
        <span className="font-bold text-emerald-700">{modeLabel}:</span> {scope.targetName}
        <span className="mx-2 text-slate-300">|</span>{viewLabel}
      </p>
      <button type="button" onClick={clearScope} className="w-fit rounded border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
        {isArabic ? "إلغاء النطاق" : "Clear scope"}
      </button>
    </div>
  );
}
