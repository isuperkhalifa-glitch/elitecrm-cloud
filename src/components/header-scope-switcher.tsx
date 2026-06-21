"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  ChevronDown,
  Eye,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import {
  useScope,
  type GlobalScope,
  type ScopeMode,
  type ScopePreviewMode,
} from "@/components/scope-provider";

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
  status?: string | null;
};

const emptyScope: GlobalScope = {
  mode: "all",
  targetId: "",
  targetName: "",
  targetRole: "",
  previewMode: "admin",
};

export function HeaderScopeSwitcher({ role }: { role?: string | null }) {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const isArabic = language === "ar";
  const canUse = role === "developer" || role === "admin" || scope.mode !== "all";
  const tx = (ar: string, en: string) => (isArabic ? ar : en);

  useEffect(() => {
    if (!canUse) return;
    let active = true;
    setLoading(true);
    setError("");

    fetch("/api/admin/scope-options", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load options");
        if (!active) return;
        setProfiles((payload.profiles ?? []) as Profile[]);
        setCompanies((payload.companies ?? []) as Company[]);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Unable to load options");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canUse]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (!canUse) return null;

  function apply(next: GlobalScope, closeAfter = false) {
    setError("");
    startTransition(() => {
      setScope(next);
      router.refresh();
    });
    if (closeAfter) setOpen(false);
  }

  function changeMode(mode: ScopeMode) {
    if (mode === "all") {
      apply(emptyScope);
      return;
    }

    if (mode === "user") {
      const target = profiles.find((item) => item.id === scope.targetId) ?? profiles[0];
      if (!target) {
        setError(tx("لا يوجد مستخدمون نشطون.", "No active users found."));
        return;
      }
      apply({
        mode: "user",
        targetId: target.id,
        targetName: target.full_name ?? target.email ?? target.id,
        targetRole: target.role ?? "sales",
        previewMode: "admin",
      });
      return;
    }

    const target = companies.find((item) => item.id === scope.targetId) ?? companies[0];
    if (!target) {
      setError(tx("لا توجد مراكز تدريب نشطة.", "No active training centers found."));
      return;
    }
    apply({
      mode: "company",
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
        targetId: target.id,
        targetName: target.full_name ?? target.email ?? target.id,
        targetRole: target.role ?? "sales",
      });
      return;
    }

    const target = companies.find((item) => item.id === targetId);
    if (!target) return;
    apply({
      ...scope,
      targetId: target.id,
      targetName: target.name,
      targetRole: "company",
      previewMode: "admin",
    });
  }

  function clearScope() {
    startTransition(() => {
      resetScope();
      router.refresh();
    });
    setOpen(false);
  }

  const currentLabel =
    scope.mode === "user"
      ? scope.targetName || tx("مستخدم", "User")
      : scope.mode === "company"
        ? scope.targetName || tx("مركز تدريب", "Training center")
        : tx("كل النظام", "All system");

  const CurrentIcon =
    scope.mode === "user" ? UserRound : scope.mode === "company" ? Building2 : UsersRound;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`elite-system-view-trigger ${scope.mode !== "all" ? "elite-system-view-trigger-active" : ""}`}
        aria-expanded={open}
      >
        <span className="elite-system-view-icon">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        </span>
        <span className="hidden min-w-0 text-start sm:block">
          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {tx("عرض النظام", "System view")}
          </span>
          <span className="block max-w-36 truncate text-xs font-black text-slate-700">
            {currentLabel}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className={`elite-system-view-panel ${isArabic ? "left-0" : "right-0"}`}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Eye className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-800">{tx("عرض النظام", "System view")}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {tx("اعرض البيانات حسب المستخدم أو المركز.", "Filter data by user or center.")}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 p-5">
            <div className="elite-scope-segments">
              {([
                ["all", UsersRound, tx("الكل", "All")],
                ["user", UserRound, tx("مستخدم", "User")],
                ["company", Building2, tx("مركز", "Center")],
              ] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeMode(mode)}
                  disabled={loading || isPending}
                  className={scope.mode === mode ? "elite-scope-segment-active" : ""}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {scope.mode === mode ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                {tx("جاري تحميل خيارات العرض...", "Loading view options...")}
              </div>
            ) : null}

            {!loading && scope.mode !== "all" ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">
                  {scope.mode === "user"
                    ? tx("اختر المستخدم", "Select user")
                    : tx("اختر مركز التدريب", "Select training center")}
                </label>
                <div className="relative">
                  <CurrentIcon className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
                  <select
                    value={scope.targetId}
                    onChange={(event) => changeTarget(event.target.value)}
                    disabled={isPending}
                    className="elite-scope-select"
                  >
                    {scope.mode === "user"
                      ? profiles.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.full_name ?? item.email ?? item.id}
                          </option>
                        ))
                      : companies.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>
            ) : null}

            {!loading && scope.mode === "user" ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">{tx("طريقة العرض", "View mode")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["admin", ShieldCheck, tx("رؤية الإدارة", "Admin view")],
                    ["selected", UserRound, tx("معاينة المستخدم", "User preview")],
                  ] as const).map(([previewMode, Icon, label]) => (
                    <button
                      key={previewMode}
                      type="button"
                      disabled={isPending}
                      onClick={() => apply({ ...scope, previewMode: previewMode as ScopePreviewMode })}
                      className={`elite-preview-option ${scope.previewMode === previewMode ? "elite-preview-option-active" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400">{tx("العرض الحالي", "Current view")}</p>
                <p className="mt-1 truncate text-xs font-black text-slate-700">{currentLabel}</p>
              </div>
              {scope.mode !== "all" ? (
                <button type="button" onClick={clearScope} disabled={isPending} className="elite-scope-reset">
                  <RotateCcw className="h-4 w-4" />
                  {tx("إلغاء التخصيص", "Reset")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ActiveScopeBanner() {
  const router = useRouter();
  const { language } = useI18n();
  const { scope, resetScope } = useScope();
  const [isPending, startTransition] = useTransition();

  if (scope.mode === "all") return null;

  const isArabic = language === "ar";
  const modeLabel = scope.mode === "user"
    ? (isArabic ? "المستخدم" : "User")
    : (isArabic ? "مركز التدريب" : "Training center");
  const viewLabel = scope.mode === "user" && scope.previewMode === "selected"
    ? (isArabic ? "معاينة المستخدم" : "User preview")
    : (isArabic ? "رؤية الإدارة" : "Admin view");
  const Icon = scope.mode === "user" ? UserRound : Building2;

  function clearScope() {
    startTransition(() => {
      resetScope();
      router.refresh();
    });
  }

  return (
    <div className="elite-active-scope-banner">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700">
            {isArabic ? "نطاق عرض مخصص" : "Custom view scope"}
          </p>
          <p className="truncate text-sm font-bold text-slate-700">
            {modeLabel}: {scope.targetName}
            <span className="mx-2 text-slate-300">•</span>
            {viewLabel}
          </p>
        </div>
      </div>
      <button type="button" onClick={clearScope} disabled={isPending} className="elite-scope-reset">
        <RotateCcw className="h-4 w-4" />
        {isArabic ? "عرض الكل" : "Show all"}
      </button>
    </div>
  );
}
