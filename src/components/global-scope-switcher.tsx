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
  email?: string | null;
  role: string | null;
  is_active?: boolean | null;
};

type Company = {
  id: string;
  name: string;
};

export function GlobalScopeSwitcher({ role }: { role: string | null }) {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const isArabic = language === "ar";
  const canUseSwitcher = role === "developer" || role === "admin" || role === "manager";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

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
      setLoadingOptions(true);

      let userRows: Profile[] = [];

      try {
        const usersResponse = await fetch("/api/admin/users", { cache: "no-store" });
        if (usersResponse.ok) {
          const payload = await usersResponse.json();
          userRows = ((payload.users ?? []) as Profile[]).filter((item) => item.is_active !== false);
        }
      } catch {
        userRows = [];
      }

      if (!userRows.length) {
        const { data: fallbackUsers } = await supabase
          .from("profiles")
          .select("id,full_name,email,role,is_active")
          .eq("is_active", true)
          .order("full_name", { ascending: true });

        userRows = ((fallbackUsers ?? []) as Profile[]).filter((item) => item.is_active !== false);
      }

      const { data: companyRows } = await supabase
        .from("companies")
        .select("id,name")
        .order("name", { ascending: true });

      setProfiles(userRows);
      setCompanies((companyRows ?? []) as Company[]);
      setLoadingOptions(false);
    }

    loadOptions();
  }, [canUseSwitcher, supabase]);

  if (!canUseSwitcher) return null;

  function profileName(profile?: Profile) {
    return profile?.full_name ?? profile?.email ?? profile?.id ?? "";
  }

  function changeMode(mode: ScopeMode) {
    if (mode === "all") {
      applyScope({
        mode: "all",
        targetId: "",
        targetName: "",
        targetRole: "",
        previewMode: "admin",
      });
      return;
    }

    const firstTarget = mode === "user" ? profiles[0] : companies[0];

    applyScope({
      mode,
      targetId: firstTarget?.id ?? "",
      targetName: mode === "user" ? profileName(profiles[0]) : companies[0]?.name ?? "",
      targetRole: mode === "user" ? profiles[0]?.role ?? "sales" : "company",
      previewMode: "admin",
    });
  }

  function changeTarget(targetId: string) {
    if (scope.mode === "user") {
      const user = profiles.find((item) => item.id === targetId);

      applyScope({
        ...scope,
        targetId,
        targetName: profileName(user),
        targetRole: user?.role ?? "sales",
      });

      return;
    }

    if (scope.mode === "company") {
      const company = companies.find((item) => item.id === targetId);

      applyScope({
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
        <span className="hidden 2xl:inline">{tx("\u0646\u0637\u0627\u0642 \u0627\u0644\u0639\u0631\u0636", "Scope")}</span>
      </div>

      <select
        value={scope.mode}
        onChange={(event) => changeMode(event.target.value as ScopeMode)}
        className="max-w-32 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
      >
        <option value="all">{tx("\u0627\u0644\u0643\u0644", "All")}</option>
        <option value="user">{tx("\u0645\u0633\u062a\u062e\u062f\u0645", "User")}</option>
        <option value="company">{tx("\u0634\u0631\u0643\u0629", "Company")}</option>
      </select>

      {scope.mode !== "all" ? (
        <select
          value={scope.targetId}
          onChange={(event) => changeTarget(event.target.value)}
          className="max-w-44 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
        >
          {scope.mode === "user" ? (
            profiles.length ? (
              profiles.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profileName(profile)}
                </option>
              ))
            ) : (
              <option value="">{loadingOptions ? tx("\u062a\u062d\u0645\u064a\u0644...", "Loading...") : tx("\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646", "No users")}</option>
            )
          ) : companies.length ? (
            companies.map((company) => (
              <option value={company.id} key={company.id}>
                {company.name}
              </option>
            ))
          ) : (
            <option value="">{loadingOptions ? tx("\u062a\u062d\u0645\u064a\u0644...", "Loading...") : tx("\u0644\u0627 \u062a\u0648\u062c\u062f \u0634\u0631\u0643\u0627\u062a", "No companies")}</option>
          )}
        </select>
      ) : null}

      {scope.mode === "user" ? (
        <select
          value={scope.previewMode}
          onChange={(event) =>
            applyScope({
              ...scope,
              previewMode: event.target.value as "admin" | "selected",
            })
          }
          className="max-w-40 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
        >
          <option value="admin">{tx("\u0631\u0624\u064a\u0629 \u0627\u0644\u0645\u062f\u064a\u0631", "Admin view")}</option>
          <option value="selected">{tx("\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645", "User preview")}</option>
        </select>
      ) : null}

      {scope.mode !== "all" ? (
        <button
          onClick={clearScope}
          className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/10"
          type="button"
          title={tx("\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0646\u0637\u0627\u0642", "Reset scope")}
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

  const modeLabel = scope.mode === "user" ? tx("\u0645\u0633\u062a\u062e\u062f\u0645", "User") : tx("\u0634\u0631\u0643\u0629", "Company");
  const previewLabel = scope.previewMode === "selected" ? tx("\u0645\u0639\u0627\u064a\u0646\u0629 \u0645\u0627 \u064a\u0631\u0627\u0647 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645", "User preview") : tx("\u0631\u0624\u064a\u0629 \u0627\u0644\u0645\u062f\u064a\u0631", "Admin view");

  return (
    <div className="mb-5 rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-300">{tx("\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u062d\u0627\u0644\u064a", "Current scope")}</p>
          <p className="mt-1 text-sm text-slate-300">
            {modeLabel}: <span className="font-bold text-white">{scope.targetName}</span> {" \u00b7 "} {previewLabel}
          </p>
        </div>

        <button onClick={clearScope} className="w-fit rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10" type="button">
          {tx("\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0641\u0644\u062a\u0631", "Clear filter")}
        </button>
      </div>
    </div>
  );
}