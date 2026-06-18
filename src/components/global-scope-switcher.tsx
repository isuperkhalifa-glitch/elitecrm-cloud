"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import { useScope, type GlobalScope, type ScopeMode } from "@/components/scope-provider";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Company = {
  id: string;
  name: string;
};

const roleOrder = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];

export function GlobalScopeSwitcher({ role }: { role: string | null }) {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const isArabic = language === "ar";
  const canUseSwitcher = role === "developer" || role === "admin" || role === "manager";
  const canReadAllUsers = role === "developer" || role === "admin";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const supabase = useMemo(() => createClient(), []);

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function roleLabel(value: string | null | undefined) {
    if (value === "developer") return tx("مطور النظام", "Developer");
    if (value === "admin") return tx("المدير العام", "General Manager");
    if (value === "manager") return tx("تيم ليدر سيلز", "Sales Team Leader");
    if (value === "moderator") return tx("الموديريتور", "Moderator");
    if (value === "marketer") return tx("المسوق", "Marketer");
    if (value === "sales") return tx("سيلز", "Sales");
    if (value === "finance") return tx("مالية / حسابات", "Finance");
    if (value === "data_analyst") return tx("محلل بيانات", "Data Analyst");
    return tx("مستخدم", "User");
  }

  function profileName(profile?: Profile | null) {
    if (!profile) return "";
    return profile.full_name || profile.email || profile.id;
  }

  function setScopeAndRefresh(nextScope: GlobalScope) {
    setScope(nextScope);
    window.setTimeout(() => router.refresh(), 0);
  }

  function resetAndRefresh() {
    resetScope();
    window.setTimeout(() => router.refresh(), 0);
  }

  useEffect(() => {
    if (!canUseSwitcher) return;

    async function loadOptions() {
      let loadedProfiles: Profile[] = [];

      if (canReadAllUsers) {
        const response = await fetch("/api/admin/users", { cache: "no-store" });
        if (response.ok) {
          const result = await response.json();
          loadedProfiles = (result.users ?? []) as Profile[];
        }
      }

      if (!loadedProfiles.length) {
        const { data: users } = await supabase
          .from("profiles")
          .select("id,email,full_name,role,is_active")
          .order("full_name", { ascending: true });
        loadedProfiles = (users ?? []) as Profile[];
      }

      const { data: companyRows } = await supabase
        .from("companies")
        .select("id,name")
        .order("name", { ascending: true });

      const activeProfiles = loadedProfiles
        .filter((item) => item.is_active !== false)
        .sort((a, b) => {
          const roleDiff = roleOrder.indexOf(a.role ?? "sales") - roleOrder.indexOf(b.role ?? "sales");
          if (roleDiff !== 0) return roleDiff;
          return profileName(a).localeCompare(profileName(b), isArabic ? "ar" : "en");
        });

      setProfiles(activeProfiles);
      setCompanies((companyRows ?? []) as Company[]);
    }

    loadOptions();
  }, [canReadAllUsers, canUseSwitcher, isArabic, supabase]);

  useEffect(() => {
    if (!canUseSwitcher || scope.mode !== "user" || !profiles.length) return;
    const current = profiles.find((profile) => profile.id === scope.targetId);
    if (current) return;

    const first = profiles[0];
    setScopeAndRefresh({
      ...scope,
      targetId: first.id,
      targetName: profileName(first),
      targetRole: first.role ?? "sales",
    });
  }, [canUseSwitcher, profiles, scope]);

  if (!canUseSwitcher) return null;

  function changeMode(mode: ScopeMode) {
    if (mode === "all") {
      setScopeAndRefresh({
        mode: "all",
        targetId: "",
        targetName: "",
        targetRole: "",
        previewMode: "admin",
      });
      return;
    }

    const firstTarget = mode === "user" ? profiles[0] : companies[0];

    setScopeAndRefresh({
      mode,
      targetId: firstTarget?.id ?? "",
      targetName: mode === "user" ? profileName(firstTarget as Profile | undefined) : companies[0]?.name ?? "",
      targetRole: mode === "user" ? (profiles[0]?.role ?? "sales") : "company",
      previewMode: "admin",
    });
  }

  function changeTarget(targetId: string) {
    if (scope.mode === "user") {
      const user = profiles.find((item) => item.id === targetId);
      setScopeAndRefresh({
        ...scope,
        targetId,
        targetName: profileName(user),
        targetRole: user?.role ?? "sales",
      });
      return;
    }

    if (scope.mode === "company") {
      const company = companies.find((item) => item.id === targetId);
      setScopeAndRefresh({
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
        <span className="hidden 2xl:inline">{tx("نطاق العرض", "Scope")}</span>
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
          className="max-w-56 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
        >
          {scope.mode === "user" ? (
            profiles.length ? (
              profiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profileName(profile)} — {roleLabel(profile.role)}
                </option>
              ))
            ) : (
              <option value="">{tx("لا يوجد مستخدمون متاحون", "No users available")}</option>
            )
          ) : companies.length ? (
            companies.map((company) => (
              <option value={company.id} key={company.id}>
                {company.name}
              </option>
            ))
          ) : (
            <option value="">{tx("لا توجد شركات", "No companies")}</option>
          )}
        </select>
      ) : null}

      {scope.mode === "user" ? (
        <select
          value={scope.previewMode}
          onChange={(event) =>
            setScopeAndRefresh({
              ...scope,
              previewMode: event.target.value as "admin" | "selected",
            })
          }
          className="max-w-44 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
        >
          <option value="admin">{tx("رؤية المدير", "Manager view")}</option>
          <option value="selected">{tx("معاينة المستخدم", "User preview")}</option>
        </select>
      ) : null}

      {scope.mode !== "all" ? (
        <button
          onClick={resetAndRefresh}
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

  const modeLabel = scope.mode === "user" ? tx("مستخدم", "User") : tx("شركة", "Company");
  const previewLabel =
    scope.previewMode === "selected"
      ? tx("معاينة ما يراه المستخدم", "User preview")
      : tx("رؤية المدير", "Manager view");

  return (
    <div className="mb-5 rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-300">{tx("النطاق الحالي", "Current scope")}</p>
          <p className="mt-1 text-sm text-slate-300">
            {modeLabel}: <span className="font-bold text-white">{scope.targetName}</span> · {previewLabel}
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
