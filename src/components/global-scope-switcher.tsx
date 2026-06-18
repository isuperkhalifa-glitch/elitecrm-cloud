"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import { useScope, type GlobalScope, type ScopeMode } from "@/components/scope-provider";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Company = {
  id: string;
  name: string;
};

function roleLabel(role: string | null, isArabic: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    developer: { ar: "مطور النظام", en: "Developer" },
    admin: { ar: "المدير العام", en: "General Manager" },
    manager: { ar: "تيم ليدر سيلز", en: "Sales Team Leader" },
    moderator: { ar: "الموديريتور", en: "Moderator" },
    marketer: { ar: "المسوق", en: "Marketer" },
    sales: { ar: "سيلز", en: "Sales" },
    finance: { ar: "مالية / حسابات", en: "Finance" },
    data_analyst: { ar: "محلل بيانات", en: "Data Analyst" },
  };

  return isArabic ? labels[role ?? "sales"]?.ar ?? role ?? "-" : labels[role ?? "sales"]?.en ?? role ?? "-";
}

export function GlobalScopeSwitcher({ role }: { role: string | null }) {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const isArabic = language === "ar";
  const canUseSwitcher = role === "developer" || role === "admin";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function applyScope(nextScope: GlobalScope) {
    setScope(nextScope);
    window.setTimeout(() => router.refresh(), 0);
  }

  function clearScope() {
    resetScope();
    window.setTimeout(() => router.refresh(), 0);
  }

  useEffect(() => {
    if (!canUseSwitcher) return;

    async function loadOptions() {
      setLoading(true);
      const [usersResponse, { data: companyRows }] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        supabase.from("companies").select("id,name").order("name", { ascending: true }),
      ]);

      if (usersResponse.ok) {
        const result = await usersResponse.json();
        setProfiles(((result.users ?? []) as Profile[]).filter((user) => user.is_active !== false));
      }

      setCompanies((companyRows ?? []) as Company[]);
      setLoading(false);
    }

    loadOptions();
  }, [canUseSwitcher, supabase]);

  if (!canUseSwitcher) return null;

  function changeMode(mode: ScopeMode) {
    if (mode === "all") {
      applyScope({ mode: "all", targetId: "", targetName: "", targetRole: "", previewMode: "admin" });
      return;
    }

    const firstTarget = mode === "user" ? profiles[0] : companies[0];

    applyScope({
      mode,
      targetId: firstTarget?.id ?? "",
      targetName: mode === "user" ? profiles[0]?.full_name ?? profiles[0]?.email ?? "" : companies[0]?.name ?? "",
      targetRole: mode === "user" ? profiles[0]?.role ?? "sales" : "company",
      previewMode: mode === "user" ? "selected" : "admin",
    });
  }

  function changeTarget(targetId: string) {
    if (scope.mode === "user") {
      const selectedUser = profiles.find((item) => item.id === targetId);
      applyScope({
        ...scope,
        targetId,
        targetName: selectedUser?.full_name ?? selectedUser?.email ?? "",
        targetRole: selectedUser?.role ?? "sales",
        previewMode: "selected",
      });
      return;
    }

    if (scope.mode === "company") {
      const selectedCompany = companies.find((item) => item.id === targetId);
      applyScope({
        ...scope,
        targetId,
        targetName: selectedCompany?.name ?? "",
        targetRole: "company",
        previewMode: "admin",
      });
    }
  }

  return (
    <div className="elite-scope-switcher flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
      <div className="flex items-center gap-2 px-1 text-xs text-emerald-300">
        <Eye className="h-4 w-4" />
        <span className="hidden 2xl:inline">{tx("نطاق العرض", "Scope")}</span>
      </div>

      <select
        value={scope.mode}
        onChange={(event) => changeMode(event.target.value as ScopeMode)}
        className="max-w-36 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
      >
        <option value="all">{tx("كل النظام", "All system")}</option>
        <option value="user">{tx("كمستخدم", "As user")}</option>
        <option value="company">{tx("مركز تدريب", "Training center")}</option>
      </select>

      {scope.mode !== "all" ? (
        <select
          value={scope.targetId}
          onChange={(event) => changeTarget(event.target.value)}
          className="max-w-56 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
        >
          {scope.mode === "user"
            ? profiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {(profile.full_name ?? profile.email ?? profile.id) + " — " + roleLabel(profile.role, isArabic)}
                </option>
              ))
            : companies.map((company) => (
                <option value={company.id} key={company.id}>
                  {company.name}
                </option>
              ))}
        </select>
      ) : null}

      {loading ? <span className="px-2 text-xs text-slate-400">{tx("تحميل...", "Loading...")}</span> : null}

      {scope.mode !== "all" ? (
        <button
          onClick={clearScope}
          className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/10"
          type="button"
          title={tx("إلغاء النطاق", "Reset scope")}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function ScopeBanner() {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, resetScope } = useScope();
  const isArabic = language === "ar";

  if (scope.mode === "all") return null;

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function clearScope() {
    resetScope();
    window.setTimeout(() => router.refresh(), 0);
  }

  const modeLabel = scope.mode === "user" ? tx("كمستخدم", "As user") : tx("مركز تدريب", "Training center");

  return (
    <div className="mb-5 rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-300">{tx("النطاق الحالي", "Current scope")}</p>
          <p className="mt-1 text-sm text-slate-300">
            {modeLabel}: <span className="font-bold text-white">{scope.targetName}</span>
          </p>
        </div>

        <button
          onClick={clearScope}
          className="w-fit rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
          type="button"
        >
          {tx("إلغاء الفلتر", "Clear filter")}
        </button>
      </div>
    </div>
  );
}
