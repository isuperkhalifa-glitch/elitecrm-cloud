"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarClock, CheckCircle2, CreditCard, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { usePageText, useSettingOptions } from "@/components/page-settings";
import { useScope } from "@/components/scope-provider";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  owner_id: string | null;
  program: string | null;
  assigned_at: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  last_note: string | null;
  customer_status: string | null;
  registration_status: string | null;
  payment_status: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Props = {
  initialLeads: Lead[];
  profiles: Profile[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

const registrationFallback = ["not_registered", "registered", "canceled"];
const paymentFallback = ["unpaid", "partial", "paid", "refunded"];

export function RegistrationsClient({ initialLeads, profiles, userEmail, fullName, role }: Props) {
  const { language } = useI18n();
  const { scope } = useScope();
  const isArabic = language === "ar";

  const pageTitle = usePageText("pages.registrations.title", "التسجيلات", "Registrations");
  const pageDescription = usePageText(
    "pages.registrations.description",
    "تابع العملاء المسجلين وحالة الدفع من صفحة واحدة بسيطة.",
    "Track registered customers and payment status from one simple page."
  );

  const registrationOptions = useSettingOptions("crm.registration_statuses", registrationFallback);
  const paymentOptions = useSettingOptions("crm.payment_statuses", paymentFallback);

  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function ownerName(id: string | null) {
    if (!id) return tx("غير موزع", "Unassigned");
    return profiles.find((profile) => profile.id === id)?.full_name ?? id;
  }

  function registrationLabel(value: string | null) {
    const labels: Record<string, { ar: string; en: string }> = {
      not_registered: { ar: "غير مسجل", en: "Not registered" },
      registered: { ar: "مسجل", en: "Registered" },
      canceled: { ar: "ملغي", en: "Canceled" },
    };
    return labels[value ?? ""]?.[language] ?? value ?? "-";
  }

  function paymentLabel(value: string | null) {
    const labels: Record<string, { ar: string; en: string }> = {
      unpaid: { ar: "غير مدفوع", en: "Unpaid" },
      partial: { ar: "دفع جزئي", en: "Partial" },
      paid: { ar: "مدفوع", en: "Paid" },
      refunded: { ar: "مسترد", en: "Refunded" },
    };
    return labels[value ?? ""]?.[language] ?? value ?? "-";
  }

  const scopedLeads = useMemo(() => {
    if (scope.mode === "user" && scope.targetId) {
      return leads.filter((lead) => lead.owner_id === scope.targetId);
    }
    if (scope.mode === "company" && scope.targetName) {
      return leads.filter((lead) => (lead.company_name ?? "").toLowerCase().includes(scope.targetName.toLowerCase()));
    }
    return leads;
  }, [leads, scope]);

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return scopedLeads.filter((lead) => {
      const matchesSearch =
        !keyword ||
        [lead.full_name, lead.phone, lead.email, lead.company_name, lead.program, ownerName(lead.owner_id)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesRegistration = registrationFilter === "all" || (lead.registration_status ?? "not_registered") === registrationFilter;
      const matchesPayment = paymentFilter === "all" || (lead.payment_status ?? "unpaid") === paymentFilter;
      return matchesSearch && matchesRegistration && matchesPayment;
    });
  }, [scopedLeads, search, registrationFilter, paymentFilter]);

  const stats = useMemo(() => {
    const registered = scopedLeads.filter((lead) => lead.registration_status === "registered").length;
    const paid = scopedLeads.filter((lead) => lead.payment_status === "paid").length;
    const pendingPayment = scopedLeads.filter(
      (lead) => ["registered", "paid"].includes(lead.registration_status ?? "") && (lead.payment_status ?? "unpaid") !== "paid"
    ).length;
    return { total: scopedLeads.length, registered, paid, pendingPayment };
  }, [scopedLeads]);

  async function updateLead(lead: Lead, updates: Partial<Pick<Lead, "registration_status" | "payment_status">>) {
    setMessage("");
    setError("");
    setSavingId(lead.id);

    const nextRegistration = updates.registration_status ?? lead.registration_status ?? "not_registered";
    const nextPayment = updates.payment_status ?? lead.payment_status ?? "unpaid";
    const nextCustomerStatus = nextPayment === "paid" ? "paid" : nextRegistration === "registered" ? "registered" : lead.customer_status ?? "interested";

    const payload = {
      registration_status: nextRegistration,
      payment_status: nextPayment,
      customer_status: nextCustomerStatus,
      last_contact_at: new Date().toISOString(),
    };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", lead.id)
      .select("id,full_name,phone,email,company_name,source,status,priority,owner_id,program,assigned_at,last_contact_at,next_follow_up_at,last_note,customer_status,registration_status,payment_status,created_at")
      .single();

    setSavingId(null);

    if (error || !data) {
      setError(tx("تعذر حفظ التحديث. حاول مرة أخرى.", "Unable to save update. Try again."));
      return;
    }

    setLeads((current) => current.map((item) => (item.id === lead.id ? (data as Lead) : item)));
    setMessage(tx("تم تحديث التسجيل بنجاح.", "Registration updated successfully."));
  }

  const canEdit = role === "admin" || role === "manager" || role === "sales" || role === "finance";

  return (
    <AppShell titleKey="registrations" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">{pageDescription}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{pageTitle}</h1>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label={tx("كل العملاء", "All customers")} value={stats.total} />
        <Stat label={tx("مسجل", "Registered")} value={stats.registered} />
        <Stat label={tx("مدفوع", "Paid")} value={stats.paid} />
        <Stat label={tx("بانتظار الدفع", "Pending payment")} value={stats.pendingPayment} />
      </div>

      <section className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tx("ابحث باسم العميل أو البرنامج أو رقم الجوال...", "Search customer, program, or phone...")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-11 py-3 text-sm text-white outline-none focus:border-emerald-400"
            />
          </div>

          <select
            value={registrationFilter}
            onChange={(event) => setRegistrationFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
          >
            <option value="all">{tx("كل حالات التسجيل", "All registration statuses")}</option>
            {registrationOptions.map((status) => (
              <option key={status} value={status}>{registrationLabel(status)}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
          >
            <option value="all">{tx("كل حالات الدفع", "All payment statuses")}</option>
            {paymentOptions.map((status) => (
              <option key={status} value={status}>{paymentLabel(status)}</option>
            ))}
          </select>
        </div>

        {message ? <div className="mt-4 text-sm font-bold text-emerald-300">{message}</div> : null}
        {error ? <div className="mt-4 text-sm font-bold text-red-300">{error}</div> : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredLeads.map((lead) => (
          <article key={lead.id} className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{ownerName(lead.owner_id)}</p>
                <h2 className="mt-1 text-xl font-black text-white">{lead.full_name}</h2>
                <p className="mt-1 text-sm text-slate-400">{lead.program ?? lead.source ?? tx("برنامج غير محدد", "No program")}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300">{registrationLabel(lead.registration_status ?? "not_registered")}</span>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{paymentLabel(lead.payment_status ?? "unpaid")}</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Info icon={<CreditCard className="h-4 w-4" />} label={tx("رقم الجوال", "Phone")} value={lead.phone ?? "-"} />
              <Info icon={<CalendarClock className="h-4 w-4" />} label={tx("متابعة قادمة", "Next follow-up")} value={lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US") : "-"} />
            </div>

            {lead.last_note ? <p className="mt-4 rounded-2xl bg-white/[0.03] p-3 text-sm text-slate-300">{lead.last_note}</p> : null}

            {canEdit ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <select
                  value={lead.registration_status ?? "not_registered"}
                  onChange={(event) => updateLead(lead, { registration_status: event.target.value })}
                  disabled={savingId === lead.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60"
                >
                  {registrationOptions.map((status) => <option key={status} value={status}>{registrationLabel(status)}</option>)}
                </select>

                <select
                  value={lead.payment_status ?? "unpaid"}
                  onChange={(event) => updateLead(lead, { payment_status: event.target.value })}
                  disabled={savingId === lead.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60"
                >
                  {paymentOptions.map((status) => <option key={status} value={status}>{paymentLabel(status)}</option>)}
                </select>

                <button
                  type="button"
                  onClick={() => updateLead(lead, { registration_status: "registered" })}
                  disabled={savingId === lead.id}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-60"
                >
                  {tx("تسجيل", "Register")}
                </button>

                <button
                  type="button"
                  onClick={() => updateLead(lead, { registration_status: "registered", payment_status: "paid" })}
                  disabled={savingId === lead.id}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {tx("تم الدفع", "Paid")}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {!filteredLeads.length ? (
        <div className="safe-card mt-6 rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
          {tx("لا توجد تسجيلات مطابقة للفلاتر الحالية.", "No registrations match the current filters.")}
        </div>
      ) : null}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="safe-card rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="flex items-center gap-2 text-xs text-slate-500">{icon} {label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}
