"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, LogOut, Mail, Menu, UserCog, X } from "lucide-react";
import { AdminEditButton } from "@/components/admin-edit-button";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/language-provider";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { useScope } from "@/components/scope-provider";
import { createClient } from "@/lib/supabase/client";
import { AppSidebar } from "@/components/app-shell/sidebar";
import { normalizeRole, pageTitles, roleLabel } from "@/components/app-shell/navigation";

type AppShellProps = {
  titleKey: string;
  userEmail: string | null;
  fullName?: string | null;
  role?: string | null;
  children: ReactNode;
};

type Company = { id: string; name: string };

export function AppShell({ titleKey, userEmail, fullName, role, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const isArabic = language === "ar";
  const currentRole = normalizeRole(role);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    requests: true,
    customers: true,
    sales: true,
    academy: true,
    reports: false,
    system: false,
  });

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;
    async function loadCompanies() {
      const { data } = await supabase.from("companies").select("id,name").order("name");
      if (mounted) setCompanies((data ?? []) as Company[]);
    }
    loadCompanies();
    const savedYear = window.localStorage.getItem("elitecrm-v8-year");
    if (savedYear) setYear(savedYear);
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const sideClass = isArabic ? "right-0 border-l" : "left-0 border-r";
  const contentPadding = sidebarOpen ? (isArabic ? "lg:pr-[230px]" : "lg:pl-[230px]") : "";
  const hiddenTransform = isArabic ? "translate-x-full" : "-translate-x-full";
  const pageTitle = pageTitles[titleKey] ?? { ar: titleKey, en: titleKey };

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function changeCompany(companyId: string) {
    if (!companyId) {
      resetScope();
      window.setTimeout(() => router.refresh(), 0);
      return;
    }
    const company = companies.find((item) => item.id === companyId);
    setScope({
      mode: "company",
      targetId: companyId,
      targetName: company?.name ?? "",
      targetRole: "company",
      previewMode: "admin",
    });
    window.setTimeout(() => router.refresh(), 0);
  }

  function changeYear(nextYear: string) {
    setYear(nextYear);
    window.localStorage.setItem("elitecrm-v8-year", nextYear);
  }

  const sidebar = (
    <AppSidebar
      pathname={pathname}
      isArabic={isArabic}
      currentRole={currentRole}
      fullName={fullName}
      userEmail={userEmail}
      companies={companies}
      scopeMode={scope.mode}
      scopeTargetId={scope.targetId}
      year={year}
      openGroups={openGroups}
      onToggleGroup={(key) => setOpenGroups((current) => ({ ...current, [key]: !current[key] }))}
      onCompanyChange={changeCompany}
      onYearChange={changeYear}
      onClose={() => setMobileOpen(false)}
    />
  );

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="v8-shell min-h-screen bg-[#f4f5f7] text-slate-700">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="hidden rounded-md p-2 text-[#29455f] hover:bg-slate-100 lg:inline-flex"
            aria-label={isArabic ? "إظهار أو إخفاء القائمة" : "Toggle sidebar"}
          >
            <Menu className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-md p-2 text-[#29455f] hover:bg-slate-100 lg:hidden"
            aria-label={isArabic ? "فتح القائمة" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-emerald-600">
              {isArabic ? "نظام إدارة المبيعات والتدريب" : "Sales and training management"}
            </p>
            <h1 className="truncate text-lg font-bold text-[#29455f]">
              {isArabic ? pageTitle.ar : pageTitle.en}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden rounded-md p-2 text-[#29455f] hover:bg-slate-100 md:inline-flex"
              aria-label={isArabic ? "الرسائل" : "Messages"}
            >
              <Mail className="h-5 w-5" />
            </button>
            <NotificationBell />
            <ThemeToggle />
            <LanguageToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[#29455f] hover:bg-slate-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  <UserCog className="h-4 w-4" />
                </div>
                <span className="hidden max-w-32 truncate md:block">{fullName ?? userEmail ?? "-"}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {accountOpen ? (
                <div className={`absolute top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl ${isArabic ? "left-0" : "right-0"}`}>
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-bold">{fullName ?? userEmail ?? "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{roleLabel(currentRole, isArabic)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {isArabic ? "تسجيل الخروج" : "Sign out"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <aside className={`fixed inset-y-0 z-40 hidden w-[230px] pt-16 transition-transform duration-300 lg:block ${sideClass} ${sidebarOpen ? "translate-x-0" : hiddenTransform}`}>
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
          />
          <aside className={`absolute inset-y-0 w-[270px] pt-16 ${sideClass}`}>{sidebar}</aside>
        </div>
      ) : null}

      <main className={`min-h-screen pt-16 transition-[padding] duration-300 ${contentPadding}`}>
        <div className="p-3 md:p-5">
          <AdminEditButton role={role ?? null} />
          {children}
        </div>
      </main>
    </div>
  );
}
