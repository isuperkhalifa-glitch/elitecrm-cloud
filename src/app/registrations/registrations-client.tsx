"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BookOpen, Building2, CalendarClock, CheckCircle2, CreditCard, Search, UserRound } from "lucide-react";
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
  company_id?: string | null;
  company_name: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  owner_id: string | null;
  program: string | null;
  course_id?: string | null;
  course_price?: number | null;
  discount_code?: string | null;
  discount_value?: number | null;
  final_price?: number | null;
  assigned_at: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  last_note: string | null;
  customer_status: string | null;
  registration_status: string | null;
  payment_status: string | null;
  created_at: string;
};

type Profile = { id: string; full_name: string | null; role: string | null; is_active: boolean | null };
type Course = { id: string; code: string | null; name: string; name_ar: string | null; name_en: string | null; base_price: number | null; sale_price: number | null; discount_type: string | null; discount_value: number | null; discount_code: string | null; currency: string | null; is_active: boolean | null; sort_order: number | null };
type Company = { id: string; name: string; industry: string | null; status: string | null };

type Props = {
  initialLeads: Lead[];
  profiles: Profile[];
  courses: Course[];
  companies: Company[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

const registrationFallback = ["not_registered", "registered", "canceled"];
const paymentFallback = ["unpaid", "partial", "paid", "refunded"];

function toMoney(value: number | string | null | undefined, currency = "SAR") {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + currency;
}

export function RegistrationsClient({ initialLeads, profiles, courses, companies, userEmail, fullName, role }: Props) {
  const { language } = useI18n();
  const { scope } = useScope();
  const isArabic = language === "ar";

  const pageTitle = usePageText("pages.registrations.title", "ط§ظ„طھط³ط¬ظٹظ„ط§طھ", "Registrations");
  const pageDescription = usePageText(
    "pages.registrations.description",
    "ط³ط¬ظ„ ط§ظ„ط¹ظ…ظٹظ„ ط¹ظ„ظ‰ ط§ظ„ط¯ظˆط±ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظˆط­ط¯ط¯ ط§ظ„ط´ط±ظƒط© ظˆط§ظ„ط³ط¹ط± ظˆط§ظ„ط®طµظ… ظˆط­ط§ظ„ط© ط§ظ„ط¯ظپط¹.",
    "Register customers to courses, companies, prices, discounts, and payment status."
  );

  const registrationOptions = useSettingOptions("crm.registration_statuses", registrationFallback);
  const paymentOptions = useSettingOptions("crm.payment_statuses", paymentFallback);

  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) { return isArabic ? ar : en; }
  function ownerName(id: string | null) { if (!id) return tx("ط؛ظٹط± ظ…ظˆط²ط¹", "Unassigned"); return profiles.find((profile) => profile.id === id)?.full_name ?? id; }
  function getCourse(id?: string | null) { return courses.find((course) => course.id === id) ?? null; }
  function getCompany(id?: string | null) { return companies.find((company) => company.id === id) ?? null; }
  function courseTitle(course: Course | null) { if (!course) return tx("ظ„ظ… ظٹطھظ… ط§ط®طھظٹط§ط± ط¯ظˆط±ط©", "No course selected"); return (isArabic ? course.name_ar : course.name_en) || course.name; }
  function companyTitle(lead: Lead) { return getCompany(lead.company_id)?.name ?? lead.company_name ?? tx("ظ„ظ… ظٹطھظ… ط§ط®طھظٹط§ط± ط´ط±ظƒط©", "No company selected"); }
  function courseBase(course: Course | null) { if (!course) return 0; return Number(course.sale_price ?? course.base_price ?? 0); }

  function registrationLabel(value: string | null) {
    const labels: Record<string, { ar: string; en: string }> = {
      not_registered: { ar: "ط؛ظٹط± ظ…ط³ط¬ظ„", en: "Not registered" },
      registered: { ar: "ظ…ط³ط¬ظ„", en: "Registered" },
      canceled: { ar: "ظ…ظ„ط؛ظٹ", en: "Canceled" },
    };
    return labels[value ?? ""]?.[language] ?? value ?? "-";
  }

  function paymentLabel(value: string | null) {
    const labels: Record<string, { ar: string; en: string }> = {
      unpaid: { ar: "ط؛ظٹط± ظ…ط¯ظپظˆط¹", en: "Unpaid" },
      partial: { ar: "ط¯ظپط¹ ط¬ط²ط¦ظٹ", en: "Partial" },
      paid: { ar: "ظ…ط¯ظپظˆط¹", en: "Paid" },
      refunded: { ar: "ظ…ط³طھط±ط¯", en: "Refunded" },
    };
    return labels[value ?? ""]?.[language] ?? value ?? "-";
  }

  const scopedLeads = useMemo(() => {
    if (scope.mode === "user" && scope.targetId) return leads.filter((lead) => lead.owner_id === scope.targetId);
    if (scope.mode === "company" && scope.targetName) return leads.filter((lead) => (lead.company_name ?? "").toLowerCase().includes(scope.targetName.toLowerCase()));
    return leads;
  }, [leads, scope]);

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return scopedLeads.filter((lead) => {
      const course = getCourse(lead.course_id);
      const companyName = companyTitle(lead);
      const matchesSearch = !keyword || [lead.full_name, lead.phone, lead.email, companyName, lead.program, courseTitle(course), ownerName(lead.owner_id)].filter(Boolean).join(" ").toLowerCase().includes(keyword);
      const matchesCompany = companyFilter === "all" || lead.company_id === companyFilter || getCompany(companyFilter)?.name === lead.company_name;
      const matchesCourse = courseFilter === "all" || lead.course_id === courseFilter;
      const matchesRegistration = registrationFilter === "all" || (lead.registration_status ?? "not_registered") === registrationFilter;
      const matchesPayment = paymentFilter === "all" || (lead.payment_status ?? "unpaid") === paymentFilter;
      return matchesSearch && matchesCompany && matchesCourse && matchesRegistration && matchesPayment;
    });
  }, [scopedLeads, search, companyFilter, courseFilter, registrationFilter, paymentFilter, courses, companies, language]);

  const stats = useMemo(() => {
    const registered = scopedLeads.filter((lead) => lead.registration_status === "registered").length;
    const paid = scopedLeads.filter((lead) => lead.payment_status === "paid").length;
    const pendingPayment = scopedLeads.filter((lead) => ["registered", "paid"].includes(lead.registration_status ?? "") && (lead.payment_status ?? "unpaid") !== "paid").length;
    return { total: scopedLeads.length, registered, paid, pendingPayment };
  }, [scopedLeads]);

  async function updateLead(lead: Lead, updates: Partial<Lead>) {
    setMessage(""); setError(""); setSavingId(lead.id);
    const nextRegistration = updates.registration_status ?? lead.registration_status ?? "not_registered";
    const nextPayment = updates.payment_status ?? lead.payment_status ?? "unpaid";
    const nextCoursePrice = updates.course_price ?? lead.course_price ?? courseBase(getCourse(updates.course_id ?? lead.course_id));
    const nextDiscount = updates.discount_value ?? lead.discount_value ?? 0;
    const nextFinal = updates.final_price ?? Math.max(Number(nextCoursePrice ?? 0) - Number(nextDiscount ?? 0), 0);
    const nextCustomerStatus = nextPayment === "paid" ? "paid" : nextRegistration === "registered" ? "registered" : lead.customer_status ?? "interested";
    const payload = { ...updates, registration_status: nextRegistration, payment_status: nextPayment, customer_status: nextCustomerStatus, course_price: nextCoursePrice, discount_value: nextDiscount, final_price: nextFinal, last_contact_at: new Date().toISOString() };
    const supabase = createClient();
    const { data, error } = await supabase.from("leads").update(payload).eq("id", lead.id).select("*").single();
    setSavingId(null);
    if (error || !data) { setError(tx("طھط¹ط°ط± ط­ظپط¸ ط§ظ„طھط­ط¯ظٹط«. طھط£ظƒط¯ ط£ظ†ظƒ ط´ط؛ظ„طھ ظ…ظ„ظپ SQL ط§ظ„ط£ط®ظٹط±.", "Unable to save update. Make sure the latest SQL file is applied.")); return; }
    setLeads((current) => current.map((item) => item.id === lead.id ? (data as Lead) : item));
    setMessage(tx("طھظ… طھط­ط¯ظٹط« ط§ظ„طھط³ط¬ظٹظ„ ط¨ظ†ط¬ط§ط­.", "Registration updated successfully."));
  }

  const canEdit = ["developer", "admin", "manager", "moderator", "sales", "finance"].includes(role ?? "");

  return (
    <AppShell titleKey="registrations" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">{pageDescription}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{pageTitle}</h1>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label={tx("ظƒظ„ ط§ظ„ط¹ظ…ظ„ط§ط،", "All customers")} value={stats.total} />
        <Stat label={tx("ظ…ط³ط¬ظ„", "Registered")} value={stats.registered} />
        <Stat label={tx("ظ…ط¯ظپظˆط¹", "Paid")} value={stats.paid} />
        <Stat label={tx("ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط¯ظپط¹", "Pending payment")} value={stats.pendingPayment} />
      </div>

      <section className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tx("ط§ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„ ط£ظˆ ط§ظ„ط´ط±ظƒط© ط£ظˆ ط§ظ„ط¯ظˆط±ط© ط£ظˆ ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„...", "Search customer, company, course, or phone...")} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-11 py-3 text-sm text-white outline-none focus:border-emerald-400" />
          </div>
          <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">
            <option value="all">{tx("ظƒظ„ ط§ظ„ط´ط±ظƒط§طھ", "All companies")}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">
            <option value="all">{tx("ظƒظ„ ط§ظ„ط¯ظˆط±ط§طھ", "All courses")}</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{courseTitle(course)}</option>)}
          </select>
          <select value={registrationFilter} onChange={(event) => setRegistrationFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"><option value="all">{tx("ظƒظ„ ط­ط§ظ„ط§طھ ط§ظ„طھط³ط¬ظٹظ„", "All registration statuses")}</option>{registrationOptions.map((status) => <option key={status} value={status}>{registrationLabel(status)}</option>)}</select>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"><option value="all">{tx("ظƒظ„ ط­ط§ظ„ط§طھ ط§ظ„ط¯ظپط¹", "All payment statuses")}</option>{paymentOptions.map((status) => <option key={status} value={status}>{paymentLabel(status)}</option>)}</select>
        </div>
        {message ? <div className="mt-4 text-sm font-bold text-emerald-300">{message}</div> : null}
        {error ? <div className="mt-4 text-sm font-bold text-red-300">{error}</div> : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredLeads.map((lead) => {
          const course = getCourse(lead.course_id);
          const company = getCompany(lead.company_id);
          const currentPrice = lead.course_price ?? courseBase(course);
          const currentDiscount = lead.discount_value ?? course?.discount_value ?? 0;
          const currentFinal = lead.final_price ?? Math.max(Number(currentPrice ?? 0) - Number(currentDiscount ?? 0), 0);
          return (
            <article key={lead.id} className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">{ownerName(lead.owner_id)}</p>
                  <h2 className="mt-1 text-xl font-black text-white">{lead.full_name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{companyTitle(lead)} آ· {courseTitle(course)}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2"><span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-300">{registrationLabel(lead.registration_status ?? "not_registered")}</span><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{paymentLabel(lead.payment_status ?? "unpaid")}</span></div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Info icon={<CreditCard className="h-4 w-4" />} label={tx("ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„", "Phone")} value={lead.phone ?? "-"} />
                <Info icon={<CalendarClock className="h-4 w-4" />} label={tx("ظ…طھط§ط¨ط¹ط© ظ‚ط§ط¯ظ…ط©", "Next follow-up")} value={lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US") : "-"} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Info icon={<Building2 className="h-4 w-4" />} label={tx("ط§ظ„ط´ط±ظƒط©", "Company")} value={company?.name ?? lead.company_name ?? "-"} />
                <Info icon={<BookOpen className="h-4 w-4" />} label={tx("ط§ظ„ط¯ظˆط±ط©", "Course")} value={courseTitle(course)} />
                <Info icon={<CreditCard className="h-4 w-4" />} label={tx("ط§ظ„ط³ط¹ط±", "Price")} value={toMoney(currentPrice, course?.currency ?? "SAR")} />
                <Info icon={<CheckCircle2 className="h-4 w-4" />} label={tx("ط§ظ„طµط§ظپظٹ", "Final")} value={toMoney(currentFinal, course?.currency ?? "SAR")} />
              </div>

              {lead.last_note ? <p className="mt-4 rounded-2xl bg-white/[0.03] p-3 text-sm text-slate-300">{lead.last_note}</p> : null}

              {canEdit ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <select value={lead.company_id ?? ""} onChange={(event) => { const selected = getCompany(event.target.value); updateLead(lead, { company_id: event.target.value || null, company_name: selected?.name ?? null }); }} disabled={savingId === lead.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60">
                    <option value="">{tx("ط§ط®طھط± ط§ظ„ط´ط±ظƒط©", "Choose company")}</option>
                    {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <select value={lead.course_id ?? ""} onChange={(event) => { const selected = getCourse(event.target.value); const price = courseBase(selected); const discount = Number(selected?.discount_value ?? 0); updateLead(lead, { course_id: event.target.value || null, course_price: price, discount_code: selected?.discount_code ?? null, discount_value: discount, final_price: Math.max(price - discount, 0) }); }} disabled={savingId === lead.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60">
                    <option value="">{tx("ط§ط®طھط± ط§ظ„ط¯ظˆط±ط©", "Choose course")}</option>
                    {courses.map((item) => <option key={item.id} value={item.id}>{courseTitle(item)} - {toMoney(courseBase(item), item.currency ?? "SAR")}</option>)}
                  </select>
                  <select value={lead.registration_status ?? "not_registered"} onChange={(event) => updateLead(lead, { registration_status: event.target.value })} disabled={savingId === lead.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60">{registrationOptions.map((status) => <option key={status} value={status}>{registrationLabel(status)}</option>)}</select>
                  <select value={lead.payment_status ?? "unpaid"} onChange={(event) => updateLead(lead, { payment_status: event.target.value })} disabled={savingId === lead.id} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60">{paymentOptions.map((status) => <option key={status} value={status}>{paymentLabel(status)}</option>)}</select>
                  <input defaultValue={currentPrice} onBlur={(event) => updateLead(lead, { course_price: Number(event.target.value) })} type="number" placeholder={tx("ط³ط¹ط± ط§ظ„ط¯ظˆط±ط©", "Course price")} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
                  <input defaultValue={currentDiscount} onBlur={(event) => updateLead(lead, { discount_value: Number(event.target.value) })} type="number" placeholder={tx("ظ‚ظٹظ…ط© ط§ظ„ط®طµظ…", "Discount value")} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
                  <input defaultValue={lead.discount_code ?? course?.discount_code ?? ""} onBlur={(event) => updateLead(lead, { discount_code: event.target.value || null })} placeholder={tx("ظƒظˆط¯ ط§ظ„ط®طµظ…", "Discount code")} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" dir="ltr" />
                </div>
              ) : null}
            </article>
          );
        })}
        {filteredLeads.length === 0 ? <div className="safe-card rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">{tx("ظ„ط§ طھظˆط¬ط¯ طھط³ط¬ظٹظ„ط§طھ.", "No registrations found.")}</div> : null}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) { return <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-slate-400">{label}</p><h2 className="mt-2 text-3xl font-black text-white">{value}</h2></div>; }
function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-3"><span className="text-emerald-300">{icon}</span><span><span className="block text-xs text-slate-500">{label}</span><span className="mt-1 block text-sm font-bold text-white">{value}</span></span></div>; }
