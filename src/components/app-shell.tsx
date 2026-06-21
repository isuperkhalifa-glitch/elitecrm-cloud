"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { ChevronDown, Loader2, LogOut, Menu, UserCog, X } from "lucide-react";
import { AdminEditButton } from "@/components/admin-edit-button";
import { ActiveScopeBanner, HeaderScopeSwitcher } from "@/components/header-scope-switcher";
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

const pageDescriptions: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: "ملخص الأداء والتشغيل في مكان واحد", en: "A complete operational performance overview" },
  calendar: { ar: "المتابعات والمواعيد والمهام القادمة", en: "Upcoming follow-ups, appointments, and tasks" },
  requests: { ar: "إدارة الطلبات الداخلية ومسؤوليات الفريق", en: "Manage internal requests and team ownership" },
  calls: { ar: "تشغيل المكالمات وتسجيل نتائج التواصل", en: "Run calls and record communication outcomes" },
  customers: { ar: "ملفات العملاء والمتابعات والتسجيلات", en: "Customer records, follow-ups, and registrations" },
  customersAll: { ar: "قاعدة العملاء الكاملة", en: "The complete customer database" },
  customersDistributed: { ar: "العملاء المسندون لفريق المبيعات", en: "Customers assigned to the sales team" },
  customersIvr: { ar: "العملاء القادمين من الرد الآلي", en: "Customers received through IVR" },
  customersManual: { ar: "العملاء المضافون يدويًا", en: "Manually entered customers" },
  customersRedirected: { ar: "العملاء المحولون بين أعضاء الفريق", en: "Customers transferred between team members" },
  customersInterested: { ar: "العملاء المهتمون قبل إتمام التسجيل", en: "Interested customers awaiting registration" },
  customersOverdue: { ar: "المتابعات التي تجاوزت موعدها", en: "Follow-ups that passed their due date" },
  registrations: { ar: "التسجيلات والمدفوعات وحالة الطلاب", en: "Registrations, payments, and student status" },
  courses: { ar: "إدارة البرامج والأسعار وحالة الإتاحة", en: "Manage programs, pricing, and availability" },
  trainingCenters: { ar: "بيانات مراكز التدريب والعمولات", en: "Training center data and commission rules" },
  imports: { ar: "رفع وتنظيم البيانات بدون فقد السجل التشغيلي", en: "Import data without losing operational history" },
  distribution: { ar: "توزيع العملاء وموازنة حمل فريق المبيعات", en: "Assign customers and balance sales workload" },
  dataQuality: { ar: "كشف التكرار والنواقص ومشكلات البيانات", en: "Detect duplicates, missing fields, and data issues" },
  commissions: { ar: "احتساب ومراجعة مستحقات فريق المبيعات", en: "Calculate and review sales commissions" },
  reports: { ar: "تحليل المصادر والتوزيع والإنجاز", en: "Analyze sources, distribution, and completion" },
  users: { ar: "إدارة المستخدمين والأدوار وحالة الحسابات", en: "Manage users, roles, and account status" },
  settings: { ar: "إعدادات التشغيل العامة للنظام", en: "General system operating settings" },
  customize: { ar: "تخصيص الهوية وتجربة الاستخدام", en: "Customize branding and user experience" },
  developer: { ar: "أدوات الفحص والصيانة التقنية", en: "Technical inspection and maintenance tools" },
};

function readYearCookie() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )elitecrm-year=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function AppShell({ titleKey, userEmail, fullName, role, children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useI18n();
  const { scope, setScope, resetScope } = useScope();
  const [isRefreshing, startTransition] = useTransition();
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

    void loadCompanies();

    const selectedYear =
      readYearCookie() ||
      window.localStorage.getItem("elitecrm-v8-year") ||
      String(new Date().getFullYear());
    setYear(selectedYear);
    window.localStorage.setItem("elitecrm-v8-year", selectedYear);
    document.cookie = `elitecrm-year=${encodeURIComponent(selectedYear)}; path=/; max-age=31536000; SameSite=Lax`;

    const savedSidebar = window.localStorage.getItem("elitecrm-sidebar-open");
    if (savedSidebar !== null) setSidebarOpen(savedSidebar === "true");

    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const sideClass = isArabic ? "right-0 border-l" : "left-0 border-r";
  const contentPadding = sidebarOpen
    ? isArabic
      ? "lg:pr-[252px]"
      : "lg:pl-[252px]"
    : "";
  const hiddenTransform = isArabic ? "translate-x-full" : "-translate-x-full";
  const pageTitle = pageTitles[titleKey] ?? { ar: titleKey, en: titleKey };
  const pageDescription = pageDescriptions[titleKey] ?? {
    ar: "مساحة عمل مستقلة ومنظمة",
    en: "An independent and organized workspace",
  };

  const pageInstanceKey = [
    pathname,
    searchParams.toString(),
    scope.mode,
    scope.targetId,
    scope.previewMode,
    year,
  ].join("::");

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function toggleSidebar() {
    setSidebarOpen((current) => {
      const next = !current;
      window.localStorage.setItem("elitecrm-sidebar-open", String(next));
      return next;
    });
  }

  function refreshPage() {
    startTransition(() => router.refresh());
  }

  function changeCompany(companyId: string) {
    if (!companyId) {
      startTransition(() => {
        resetScope();
        router.refresh();
      });
      return;
    }

    const company = companies.find((item) => item.id === companyId);
    if (!company) return;

    startTransition(() => {
      setScope({
        mode: "company",
        targetId: companyId,
        targetName: company.name,
        targetRole: "company",
        previewMode: "admin",
      });
      router.refresh();
    });
  }

  function changeYear(nextYear: string) {
    setYear(nextYear);
    window.localStorage.setItem("elitecrm-v8-year", nextYear);
    document.cookie = `elitecrm-year=${encodeURIComponent(nextYear)}; path=/; max-age=31536000; SameSite=Lax`;
    refreshPage();
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
      onToggleGroup={(key) =>
        setOpenGroups((current) => ({ ...current, [key]: !current[key] }))
      }
      onCompanyChange={changeCompany}
      onYearChange={changeYear}
      onClose={() => setMobileOpen(false)}
    />
  );

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="v8-shell elite-app-shell min-h-screen text-slate-700">
      <header className="elite-app-header fixed inset-x-0 top-0 z-50 h-[72px]">
        <div className="flex h-full items-center gap-3 px-3 md:px-5">
          <button
            type="button"
            onClick={toggleSidebar}
            className="elite-header-icon hidden lg:inline-flex"
            aria-label={isArabic ? "إظهار أو إخفاء القائمة" : "Toggle sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="elite-header-icon lg:hidden"
            aria-label={isArabic ? "فتح القائمة" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="hidden h-1.5 w-1.5 rounded-full bg-emerald-500 sm:block" />
              <p className="hidden text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600 sm:block">
                {isArabic ? "EliteCRM • مساحة تشغيل مستقلة" : "EliteCRM • Independent workspace"}
              </p>
            </div>
            <h1 className="truncate text-base font-black text-[#29455f] md:text-lg">
              {isArabic ? pageTitle.ar : pageTitle.en}
            </h1>
          </div>

          <HeaderScopeSwitcher role={role} />

          <div className="flex items-center gap-1.5">
            {isRefreshing ? (
              <span className="elite-header-icon hidden md:inline-flex" title={isArabic ? "جاري تحديث الصفحة" : "Refreshing"}>
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              </span>
            ) : null}
            <NotificationBell />
            <ThemeToggle />
            <LanguageToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="elite-account-trigger"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#29455f]">
                  <UserCog className="h-4 w-4" />
                </div>
                <span className="hidden max-w-28 truncate text-xs font-bold md:block">
                  {fullName ?? userEmail ?? "-"}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${accountOpen ? "rotate-180" : ""}`} />
              </button>

              {accountOpen ? (
                <div className={`elite-account-menu ${isArabic ? "left-0" : "right-0"}`}>
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-black text-slate-800">{fullName ?? userEmail ?? "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{roleLabel(currentRole, isArabic)}</p>
                  </div>
                  <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    {isArabic ? "تسجيل الخروج" : "Sign out"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <aside className={`elite-sidebar-frame fixed inset-y-0 z-40 hidden w-[252px] pt-[72px] transition-transform duration-300 lg:block ${sideClass} ${sidebarOpen ? "translate-x-0" : hiddenTransform}`}>
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
          />
          <aside className={`absolute inset-y-0 w-[292px] pt-[72px] ${sideClass}`}>{sidebar}</aside>
        </div>
      ) : null}

      <main className={`min-h-screen pt-[72px] transition-[padding] duration-300 ${contentPadding}`}>
        <div className="elite-content-shell">
          <section className="elite-page-intro">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
                {isArabic ? "مساحة العمل الحالية" : "Current workspace"}
              </p>
              <h2 className="mt-1 truncate text-xl font-black text-slate-800 md:text-2xl">
                {isArabic ? pageTitle.ar : pageTitle.en}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isArabic ? pageDescription.ar : pageDescription.en}
              </p>
            </div>
            <AdminEditButton role={role ?? null} />
          </section>

          <ActiveScopeBanner />

          <div key={pageInstanceKey} className="elite-page-frame elite-page-enter">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
