"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";
import {
  BadgeDollarSign,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  RefreshCcw,
  Search,
  Settings,
  UserRound,
  XCircle,
} from "lucide-react";

type Commission = {
  id: string;
  sales_id: string | null;
  company_id: string | null;
  invoice_id: string | null;
  base_amount: number | null;
  commission_amount: number | null;
  status: string | null;
  created_at: string;
  commission_type: string | null;
  commission_value: number | null;
  paid_at: string | null;
  notes: string | null;
  updated_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  default_commission_type: string | null;
  default_commission_value: number | null;
  is_active: boolean | null;
};

type Company = {
  id: string;
  name: string;
  commission_type: string | null;
  commission_value: number | null;
};

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number | null;
  status: string | null;
  paid_at: string | null;
  company_id: string | null;
};

type Props = {
  initialCommissions: Commission[];
  profiles: Profile[];
  companies: Company[];
  invoices: Invoice[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

export function CommissionsClient({
  initialCommissions,
  profiles,
  companies,
  invoices,
  currentUserId,
  userEmail,
  fullName,
  role,
}: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const isAdmin = role === "admin";

  const [commissions, setCommissions] = useState<Commission[]>(initialCommissions);
  const [salesProfiles, setSalesProfiles] = useState<Profile[]>(profiles);
  const [selectedSalesId, setSelectedSalesId] = useState(
    profiles.find((item) => item.role === "sales")?.id ?? currentUserId
  );
  const [commissionType, setCommissionType] = useState("percentage");
  const [commissionValue, setCommissionValue] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  const profileMap = useMemo(() => {
    return new Map(salesProfiles.map((item) => [item.id, item]));
  }, [salesProfiles]);

  const companyMap = useMemo(() => {
    return new Map(companies.map((item) => [item.id, item]));
  }, [companies]);

  const invoiceMap = useMemo(() => {
    return new Map(invoices.map((item) => [item.id, item]));
  }, [invoices]);

  const filteredCommissions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return commissions.filter((commission) => {
      const salesName =
        profileMap.get(commission.sales_id ?? "")?.full_name ?? "";
      const companyName =
        companyMap.get(commission.company_id ?? "")?.name ?? "";
      const invoiceNumber =
        invoiceMap.get(commission.invoice_id ?? "")?.invoice_number ?? "";

      const matchesStatus =
        statusFilter === "all" || commission.status === statusFilter;

      const matchesKeyword =
        !keyword ||
        [
          salesName,
          companyName,
          invoiceNumber,
          commission.status,
          commission.commission_amount,
          commission.base_amount,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [commissions, search, statusFilter, profileMap, companyMap, invoiceMap]);

  const stats = useMemo(() => {
    const total = commissions.reduce(
      (sum, item) => sum + Number(item.commission_amount ?? 0),
      0
    );

    const due = commissions
      .filter((item) => item.status === "due")
      .reduce((sum, item) => sum + Number(item.commission_amount ?? 0), 0);

    const paid = commissions
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + Number(item.commission_amount ?? 0), 0);

    const pending = commissions
      .filter((item) => item.status === "pending")
      .reduce((sum, item) => sum + Number(item.commission_amount ?? 0), 0);

    return {
      count: commissions.length,
      total,
      due,
      paid,
      pending,
    };
  }, [commissions]);

  function formatMoney(value: number | string | null) {
    return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  function formatDate(value: string | null) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusLabel(status: string | null) {
    if (status === "paid") return tx("مدفوعة", "Paid");
    if (status === "due") return tx("مستحقة", "Due");
    if (status === "canceled") return tx("ملغاة", "Canceled");
    return tx("معلقة", "Pending");
  }

  function statusClass(status: string | null) {
    if (status === "paid") return "bg-emerald-400/15 text-emerald-300";
    if (status === "due") return "bg-sky-400/15 text-sky-300";
    if (status === "canceled") return "bg-red-500/15 text-red-300";
    return "bg-yellow-400/15 text-yellow-300";
  }

  function commissionRuleLabel(item: Commission) {
    if (item.commission_type === "fixed") {
      return tx("مبلغ ثابت", "Fixed amount");
    }

    return tx("نسبة مئوية", "Percentage");
  }

  async function reloadCommissions() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("commissions")
      .select("id,sales_id,company_id,invoice_id,base_amount,commission_amount,status,created_at,commission_type,commission_value,paid_at,notes,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setCommissions((data ?? []) as Commission[]);
  }

  async function recalculate() {
    setMessage("");
    setError("");
    setLoadingAction(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("recalculate_paid_invoice_commissions");

    if (error) {
      console.error(error);
      setError(error.message);
      setLoadingAction(false);
      return;
    }

    await reloadCommissions();

    setLoadingAction(false);
    setMessage(tx("تمت إعادة احتساب العمولات.", "Commissions recalculated."));
  }

  async function updateCommissionStatus(id: string, status: string) {
    setMessage("");
    setError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("commissions")
      .update({
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,sales_id,company_id,invoice_id,base_amount,commission_amount,status,created_at,commission_type,commission_value,paid_at,notes,updated_at")
      .single();

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? tx("تعذر تحديث العمولة.", "Unable to update commission."));
      return;
    }

    setCommissions((current) =>
      current.map((item) => (item.id === id ? (data as Commission) : item))
    );

    setMessage(tx("تم تحديث حالة العمولة.", "Commission status updated."));
  }

  async function saveSalesCommissionRule() {
    setMessage("");
    setError("");

    if (!isAdmin) {
      setError(tx("هذه الصلاحية للمدير فقط.", "Admin only action."));
      return;
    }

    if (!selectedSalesId) {
      setError(tx("اختر السيلز أولًا.", "Choose a sales user first."));
      return;
    }

    const numericValue = Number(commissionValue);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      setError(tx("اكتب قيمة عمولة صحيحة.", "Enter a valid commission value."));
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        default_commission_type: commissionType,
        default_commission_value: numericValue,
      })
      .eq("id", selectedSalesId)
      .select("id,full_name,role,default_commission_type,default_commission_value,is_active")
      .single();

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? tx("تعذر حفظ إعدادات العمولة.", "Unable to save commission settings."));
      return;
    }

    setSalesProfiles((current) =>
      current.map((item) => (item.id === data.id ? (data as Profile) : item))
    );

    setMessage(tx("تم حفظ عمولة السيلز.", "Sales commission rule saved."));
  }

  function loadSelectedSalesRule(id: string) {
    setSelectedSalesId(id);

    const profile = salesProfiles.find((item) => item.id === id);

    setCommissionType(profile?.default_commission_type ?? "percentage");
    setCommissionValue(String(profile?.default_commission_value ?? 0));
  }

  return (
    <AppShell
      titleKey="commissions"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">{tx("عدد العمولات", "Commissions")}</p>
            <BadgeDollarSign className="h-5 w-5 text-emerald-300" />
          </div>
          <h2 className="mt-2 text-3xl font-black">{stats.count}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{tx("إجمالي العمولات", "Total commissions")}</p>
          <h2 className="mt-2 text-2xl font-black">{formatMoney(stats.total)}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-sky-400/20 bg-sky-400/10 p-5">
          <p className="text-sm text-sky-300">{tx("المستحق", "Due")}</p>
          <h2 className="mt-2 text-2xl font-black text-sky-300">{formatMoney(stats.due)}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-sm text-emerald-300">{tx("المدفوع", "Paid")}</p>
          <h2 className="mt-2 text-2xl font-black text-emerald-300">{formatMoney(stats.paid)}</h2>
        </div>
      </div>

      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <Settings className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm text-emerald-300">{tx("محرك العمولات", "Commission Engine")}</p>
              <h2 className="text-2xl font-black">{tx("إعدادات السيلز", "Sales Settings")}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={recalculate}
              disabled={loadingAction}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
              type="button"
            >
              {loadingAction ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCcw className="h-5 w-5" />
              )}
              {tx("إعادة احتساب الفواتير المدفوعة", "Recalculate paid invoices")}
            </button>

            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-400">
              <p className="font-bold text-white">{tx("طريقة الحساب", "Calculation rule")}</p>
              <p>{tx("أولوية الحساب: عمولة الشركة ثم عمولة السيلز الافتراضية.", "Priority: company commission first, then sales default commission.")}</p>
              <p>{tx("يتم إنشاء العمولة تلقائيًا عند تحويل الفاتورة إلى مدفوعة.", "Commission is generated automatically when an invoice is marked paid.")}</p>
            </div>

            {isAdmin ? (
              <>
                <label className="block">
                  <span className="text-sm text-slate-300">{tx("السيلز", "Sales user")}</span>
                  <select
                    value={selectedSalesId}
                    onChange={(event) => loadSelectedSalesRule(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  >
                    {salesProfiles.map((profile) => (
                      <option value={profile.id} key={profile.id}>
                        {profile.full_name ?? profile.id}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300">{tx("نوع العمولة", "Commission type")}</span>
                  <select
                    value={commissionType}
                    onChange={(event) => setCommissionType(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="percentage">{tx("نسبة مئوية", "Percentage")}</option>
                    <option value="fixed">{tx("مبلغ ثابت", "Fixed amount")}</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300">
                    {commissionType === "fixed"
                      ? tx("قيمة العمولة", "Commission amount")
                      : tx("نسبة العمولة", "Commission percentage")}
                  </span>
                  <input
                    value={commissionValue}
                    onChange={(event) => setCommissionValue(event.target.value)}
                    type="number"
                    min="0"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                    dir="ltr"
                  />
                </label>

                <button
                  onClick={saveSalesCommissionRule}
                  className="w-full rounded-2xl border border-white/10 px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/10"
                  type="button"
                >
                  {tx("حفظ إعدادات السيلز", "Save sales rule")}
                </button>
              </>
            ) : null}

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {message}
              </div>
            ) : null}
          </div>
        </section>

        <section className="safe-card min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{tx("إدارة العمولات", "Commission management")}</p>
              <h2 className="mt-1 text-3xl font-black">{tx("العمولات", "Commissions")}</h2>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm md:min-w-72">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={tx("ابحث في العمولات...", "Search commissions...")}
                  className="w-full border-none bg-transparent p-0 text-white outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="all">{tx("كل الحالات", "All statuses")}</option>
                <option value="pending">{tx("معلقة", "Pending")}</option>
                <option value="due">{tx("مستحقة", "Due")}</option>
                <option value="paid">{tx("مدفوعة", "Paid")}</option>
                <option value="canceled">{tx("ملغاة", "Canceled")}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredCommissions.map((commission) => {
              const sales = profileMap.get(commission.sales_id ?? "");
              const company = companyMap.get(commission.company_id ?? "");
              const invoice = invoiceMap.get(commission.invoice_id ?? "");

              return (
                <article
                  key={commission.id}
                  className="elite-motion-card rounded-3xl border border-white/10 bg-slate-900/70 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs ${statusClass(commission.status)}`}>
                          {statusLabel(commission.status)}
                        </span>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                          {commissionRuleLabel(commission)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-400 md:grid-cols-2 xl:grid-cols-4">
                        <p className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-emerald-300" />
                          <span>{sales?.full_name ?? tx("غير محدد", "Unknown")}</span>
                        </p>

                        <p>
                          <span className="text-slate-500">{tx("الشركة", "Company")}: </span>
                          {company?.name ?? "-"}
                        </p>

                        <p dir="ltr">
                          <span className="text-slate-500">{tx("الفاتورة", "Invoice")}: </span>
                          {invoice?.invoice_number ?? "-"}
                        </p>

                        <p>
                          <span className="text-slate-500">{tx("تاريخ الإنشاء", "Created")}: </span>
                          {formatDate(commission.created_at)}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <p className="text-xs text-slate-500">{tx("قيمة الفاتورة", "Invoice value")}</p>
                          <p className="mt-1 font-bold">{formatMoney(commission.base_amount)}</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                          <p className="text-xs text-slate-500">{tx("قاعدة العمولة", "Rule")}</p>
                          <p className="mt-1 font-bold">
                            {commission.commission_type === "fixed"
                              ? formatMoney(commission.commission_value)
                              : `${commission.commission_value ?? 0}%`}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                          <p className="text-xs text-emerald-300">{tx("قيمة العمولة", "Commission")}</p>
                          <p className="mt-1 font-black text-emerald-300">
                            {formatMoney(commission.commission_amount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {commission.status !== "paid" ? (
                        <button
                          onClick={() => updateCommissionStatus(commission.id, "paid")}
                          className="flex items-center gap-1 rounded-xl border border-emerald-400/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-400/10"
                          type="button"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {tx("تعليم كمدفوعة", "Mark paid")}
                        </button>
                      ) : null}

                      {commission.status !== "due" ? (
                        <button
                          onClick={() => updateCommissionStatus(commission.id, "due")}
                          className="flex items-center gap-1 rounded-xl border border-sky-400/30 px-3 py-2 text-xs text-sky-300 hover:bg-sky-400/10"
                          type="button"
                        >
                          <CircleDollarSign className="h-3.5 w-3.5" />
                          {tx("مستحقة", "Due")}
                        </button>
                      ) : null}

                      {commission.status !== "canceled" ? (
                        <button
                          onClick={() => updateCommissionStatus(commission.id, "canceled")}
                          className="flex items-center gap-1 rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                          type="button"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {tx("إلغاء", "Cancel")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredCommissions.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
                {tx(
                  "لا توجد عمولات حتى الآن. سجّل فاتورة كمدفوعة ثم اضغط إعادة احتساب.",
                  "No commissions yet. Mark an invoice as paid, then recalculate."
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
