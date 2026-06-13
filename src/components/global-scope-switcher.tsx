"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import { useScope, type GlobalScope, type ScopeMode } from "@/components/scope-provider";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type Company = {
  id: string;
  name: string;
};

export function GlobalScopeSwitcher({ role }: { role: string | null }) {
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const isArabic = language === "ar";
  const canUseSwitcher = role === "admin" || role === "manager";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!canUseSwitcher) return;

    async function loadOptions() {
      const [{ data: users }, { data: companyRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,role")
          .order("full_name", { ascending: true }),
        supabase
          .from("companies")
          .select("id,name")
          .order("name", { ascending: true }),
      ]);

      setProfiles((users ?? []) as Profile[]);
      setCompanies((companyRows ?? []) as Company[]);
    }

    loadOptions();
  }, [canUseSwitcher, supabase]);

  if (!canUseSwitcher) return null;

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function changeMode(mode: ScopeMode) {
    if (mode === "all") {
      setScope({
        mode: "all",
        targetId: "",
        targetName: "",
        targetRole: "",
        previewMode: "admin",
      });
      return;
    }

    const firstTarget =
      mode === "user"
        ? profiles[0]
        : companies[0];

    const nextScope: GlobalScope = {
      mode,
      targetId: firstTarget?.id ?? "",
      targetName:
        mode === "user"
          ? profiles[0]?.full_name ?? profiles[0]?.id ?? ""
          : companies[0]?.name ?? "",
      targetRole:
        mode === "user"
          ? profiles[0]?.role ?? "sales"
          : "company",
      previewMode: "admin",
    };

    setScope(nextScope);
  }

  function changeTarget(targetId: string) {
    if (scope.mode === "user") {
      const user = profiles.find((item) => item.id === targetId);

      setScope({
        ...scope,
        targetId,
        targetName: user?.full_name ?? user?.id ?? "",
        targetRole: user?.role ?? "sales",
      });

      return;
    }

    if (scope.mode === "company") {
      const company = companies.find((item) => item.id === targetId);

      setScope({
        ...scope,
        targetId,
        targetName: company?.name ?? "",
        targetRole: "company",
      });
    }
  }

  return (
    <div className="elite-scope-switcher flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
      <div className="flex items-center gap-2 px-1 text-xs text-emerald-300">
        <Eye className="h-4 w-4" />
        <span className="hidden 2xl:inline">
          {tx("نطاق العرض", "Scope")}
        </span>
      </div>

      <select
        value={scope.mode}
        onChange={(event) => changeMode(event.target.value as ScopeMode)}
        className="max-w-32 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
      >
        <option value="all">{tx("الكل", "All")}</option>
        <option value="user">{tx("مستخدم", "User")}</option>
        <option value="company">{tx("شركة", "Company")}</option>
      </select>

      {scope.mode !== "all" ? (
        <select
          value={scope.targetId}
          onChange={(event) => changeTarget(event.target.value)}
          className="max-w-44 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
        >
          {scope.mode === "user"
            ? profiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profile.full_name ?? profile.id}
                </option>
              ))
            : companies.map((company) => (
                <option value={company.id} key={company.id}>
                  {company.name}
                </option>
              ))}
        </select>
      ) : null}

      {scope.mode === "user" ? (
        <select
          value={scope.previewMode}
          onChange={(event) =>
            setScope({
              ...scope,
              previewMode: event.target.value as "admin" | "selected",
            })
          }
          className="max-w-40 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
        >
          <option value="admin">{tx("رؤية الأدمن", "Admin view")}</option>
          <option value="selected">{tx("معاينة المستخدم", "User preview")}</option>
        </select>
      ) : null}

      {scope.mode !== "all" ? (
        <button
          onClick={resetScope}
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
  const { language } = useI18n();
  const { scope, resetScope } = useScope();
  const isArabic = language === "ar";

  if (scope.mode === "all") return null;

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  const modeLabel =
    scope.mode === "user"
      ? tx("مستخدم", "User")
      : tx("شركة", "Company");

  const previewLabel =
    scope.previewMode === "selected"
      ? tx("معاينة ما يراه المستخدم", "User preview")
      : tx("رؤية الأدمن", "Admin view");

  return (
    <div className="mb-5 rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-300">
            {tx("النطاق الحالي", "Current scope")}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {modeLabel}:{" "}
            <span className="font-bold text-white">{scope.targetName}</span>
            {" · "}
            {previewLabel}
          </p>
        </div>

        <button
          onClick={resetScope}
          className="w-fit rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
          type="button"
        >
          {tx("إلغاء الفلتر", "Clear filter")}
        </button>
      </div>
    </div>
  );
}
