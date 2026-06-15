"use client";

import { useMemo, useState } from "react";
import { BookOpen, Building2, CheckCircle2, CreditCard, Search, Save, UserRound, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  company_id: string | null;
  course_id: string | null;
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
  registration_amount: number | null;
  discount_amount: number | null;
  final_amount: number | null;
  discount_code: string | null;
  paid_amount: number | null;
  created_at: string;
};

type Profile = { id: string; full_name: string | null; role: string | null; is_active: boolean | null };
type TrainingCenter = { id: string; name: string; status: string | null; commission_type: string | null; commission_value: number | null };
type Course = { id: string; name: string | null; name_ar: string | null; name_en: string | null; company_id: string | null; code: string | null; price: number | null; sale_price: number | null; discount_type: string | null; discount_value: number | null; discount_code: string | null; status: string | null };
type Registration = { id: string; lead_id: string | null; company_id: string | null; course_id: string | null; sales_id: string | null; status: string | null; payment_status: string | null; list_price: number | null; discount_amount: number | null; final_price: number | null; discount_code: string | null; paid_amount: number | null; notes: string | null; created_at: string | null };

type Props = {
  initialLeads: Lead[];
  profiles: Profile[];
  trainingCenters: TrainingCenter[];
  courses: Course[];
  initialRegistrations: Registration[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type RegistrationForm = {
  lead_id: string;
  company_id: string;
  course_id: string;
  registration_status: string;
  payment_status: string;
  list_price: string;
  discount_amount: string;
  final_price: string;
  discount_code: string;
  paid_amount: string;
  notes: string;
};

const emptyForm: RegistrationForm = {
  lead_id: "",
  company_id: "",
  course_id: "",
  registration_status: "registered",
  payment_status: "unpaid",
  list_price: "0",
  discount_amount: "0",
  final_price: "0",
  discount_code: "",
  paid_amount: "0",
  notes: "",
};

function num(value: string) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function courseNet(course: Course | undefined) {
  if (!course) return { list: 0, discount: 0, final: 0, code: "" };
  const list = Number(course.price ?? 0);
  if (course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) > 0) {
    const final = Number(course.sale_price);
    return { list, discount: Math.max(0, list - final), final, code: course.discount_code ?? "" };
  }
  const discountValue = Number(course.discount_value ?? 0);
  const discount = course.discount_type === "percentage" ? list * (discountValue / 100) : course.discount_type === "fixed" ? discountValue : 0;
  return { list, discount: Math.max(0, discount), final: Math.max(0, list - discount), code: course.discount_code ?? "" };
}

export function RegistrationsClient({ initialLeads, profiles, trainingCenters, courses, initialRegistrations, currentUserId, userEmail, fullName, role }: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) { return isArabic ? ar : en; }
  function leadName(id: string | null) { return leads.find((lead) => lead.id === id)?.full_name ?? "-"; }
  function centerName(id: string | null) { return trainingCenters.find((center) => center.id === id)?.name ?? tx("ط؛ظٹط± ظ…ط­ط¯ط¯", "Not selected"); }
  function courseName(id: string | null) {
    const course = courses.find((item) => item.id === id);
    if (!course) return "-";
    return isArabic ? course.name_ar ?? course.name ?? course.name_en ?? "-" : course.name_en ?? course.name_ar ?? course.name ?? "-";
  }
  function salesName(id: string | null) { return profiles.find((profile) => profile.id === id)?.full_name ?? tx("ط؛ظٹط± ظ…ط­ط¯ط¯", "Not selected"); }

  const filteredCourses = useMemo(() => {
    if (!form.company_id) return [];
    return courses.filter((course) => course.company_id === form.company_id && (course.status ?? "active") !== "archived");
  }, [courses, form.company_id]);

  const filteredRegistrations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return registrations.filter((registration) => {
      const matchesCenter = centerFilter === "all" || registration.company_id === centerFilter;
      const matchesSearch = !keyword || [leadName(registration.lead_id), centerName(registration.company_id), courseName(registration.course_id), registration.discount_code, registration.payment_status]
        .filter(Boolean).join(" ").toLowerCase().includes(keyword);
      return matchesCenter && matchesSearch;
    });
  }, [registrations, search, centerFilter, leads, courses, trainingCenters]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const paid = registrations.filter((item) => item.payment_status === "paid").length;
    const revenue = registrations.reduce((sum, item) => sum + Number(item.final_price ?? 0), 0);
    const collected = registrations.reduce((sum, item) => sum + Number(item.paid_amount ?? 0), 0);
    return { total, paid, revenue, collected };
  }, [registrations]);

  function chooseLead(id: string) {
    const lead = leads.find((item) => item.id === id);
    setForm((current) => ({ ...current, lead_id: id, company_id: lead?.company_id ?? current.company_id, course_id: lead?.course_id ?? current.course_id }));
  }

  function chooseCenter(id: string) {
    setForm((current) => ({ ...current, company_id: id, course_id: "", list_price: "0", discount_amount: "0", final_price: "0", discount_code: "" }));
  }

  function chooseCourse(id: string) {
    const course = courses.find((item) => item.id === id);
    const pricing = courseNet(course);
    setForm((current) => ({
      ...current,
      course_id: id,
      company_id: course?.company_id ?? current.company_id,
      list_price: String(pricing.list),
      discount_amount: pricing.discount.toFixed(2),
      final_price: pricing.final.toFixed(2),
      discount_code: pricing.code,
    }));
  }

  function updateMoney(field: "list_price" | "discount_amount" | "paid_amount", value: string) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      next.final_price = Math.max(0, num(next.list_price) - num(next.discount_amount)).toFixed(2);
      return next;
    });
  }

  async function saveRegistration() {
    setMessage("");
    setError("");

    if (!form.lead_id || !form.company_id || !form.course_id) {
      setError(tx("ط§ط®طھظٹط§ط± ط§ظ„ط¹ظ…ظٹظ„ ظˆظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨ ظˆط§ظ„ط¯ظˆط±ط© ظ…ط·ظ„ظˆط¨.", "Customer, training center, and course are required."));
      return;
    }

    setSaving(true);
    const payload = {
      lead_id: form.lead_id,
      company_id: form.company_id,
      course_id: form.course_id,
      sales_id: currentUserId,
      status: form.registration_status,
      payment_status: form.payment_status,
      list_price: num(form.list_price),
      discount_amount: num(form.discount_amount),
      final_price: num(form.final_price),
      discount_code: form.discount_code.trim() || null,
      paid_amount: num(form.paid_amount),
      notes: form.notes.trim() || null,
    };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("registrations")
      .insert(payload)
      .select("id,lead_id,company_id,course_id,sales_id,status,payment_status,list_price,discount_amount,final_price,discount_code,paid_amount,notes,created_at")
      .single();

    if (error || !data) {
      console.error(error);
      setSaving(false);
      setError(error?.message ?? tx("طھط¹ط°ط± ط­ظپط¸ ط§ظ„طھط³ط¬ظٹظ„.", "Unable to save registration."));
      return;
    }

    await supabase
      .from("leads")
      .update({
        company_id: form.company_id,
        course_id: form.course_id,
        company_name: centerName(form.company_id),
        program: courseName(form.course_id),
        registration_status: form.registration_status,
        payment_status: form.payment_status,
        registration_amount: num(form.list_price),
        discount_amount: num(form.discount_amount),
        final_amount: num(form.final_price),
        discount_code: form.discount_code.trim() || null,
        paid_amount: num(form.paid_amount),
        customer_status: form.payment_status === "paid" ? "paid" : "interested",
        last_contact_at: new Date().toISOString(),
      })
      .eq("id", form.lead_id);

    setRegistrations((current) => [data as Registration, ...current]);
    setLeads((current) => current.map((lead) => lead.id === form.lead_id ? { ...lead, company_id: form.company_id, course_id: form.course_id, company_name: centerName(form.company_id), program: courseName(form.course_id), registration_status: form.registration_status, payment_status: form.payment_status, registration_amount: num(form.list_price), discount_amount: num(form.discount_amount), final_amount: num(form.final_price), discount_code: form.discount_code, paid_amount: num(form.paid_amount) } : lead));
    setForm(emptyForm);
    setSaving(false);
    setMessage(tx("طھظ… طھط³ط¬ظٹظ„ ط§ظ„ط¹ظ…ظٹظ„ ط¨ظ†ط¬ط§ط­.", "Customer registered successfully."));
  }

  const canEdit = ["developer", "admin", "manager", "moderator", "sales", "finance"].includes(role ?? "");

  return (
    <AppShell titleKey="registrations" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">{tx("ط³ط¬ظ„ ط§ظ„ط¹ظ…ظٹظ„ ظپظٹ ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨ ظˆط§ظ„ط¯ظˆط±ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظ…ط¹ ط§ظ„ط³ط¹ط± ظˆط§ظ„ط®طµظ… ظˆط§ظ„ط¯ظپط¹.", "Register the customer into the correct center/course with price, discount, and payment.")}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{tx("ط§ظ„طھط³ط¬ظٹظ„ط§طھ", "Registrations")}</h1>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label={tx("ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھط³ط¬ظٹظ„ط§طھ", "Total registrations")} value={stats.total} />
        <Stat label={tx("ظ…ط¯ظپظˆط¹ط©", "Paid")} value={stats.paid} />
        <Stat label={tx("ظ‚ظٹظ…ط© ط§ظ„طھط³ط¬ظٹظ„ط§طھ", "Registration value")} value={stats.revenue.toFixed(2)} />
        <Stat label={tx("ط§ظ„ظ…ط­طµظ„", "Collected")} value={stats.collected.toFixed(2)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Save className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-emerald-300">{tx("طھط³ط¬ظٹظ„ ط¬ط¯ظٹط¯", "New registration")}</p>
              <h2 className="text-2xl font-black text-white">{tx("ط¨ظٹط§ظ†ط§طھ ط§ظ„طھط³ط¬ظٹظ„", "Registration details")}</h2>
            </div>
          </div>

          <div className="space-y-3">
            <select value={form.lead_id} onChange={(event) => chooseLead(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
              <option value="">{tx("ط§ط®طھط± ط§ظ„ط¹ظ…ظٹظ„", "Choose customer")}</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.full_name} â€” {lead.phone ?? lead.email ?? ""}</option>)}
            </select>

            <select value={form.company_id} onChange={(event) => chooseCenter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
              <option value="">{tx("ط§ط®طھط± ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨", "Choose training center")}</option>
              {trainingCenters.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
            </select>

            <select value={form.course_id} onChange={(event) => chooseCourse(event.target.value)} disabled={!form.company_id} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400 disabled:opacity-60">
              <option value="">{tx("ط§ط®طھط± ط§ظ„ط¯ظˆط±ط©", "Choose course")}</option>
              {filteredCourses.map((course) => <option key={course.id} value={course.id}>{isArabic ? course.name_ar ?? course.name : course.name_en ?? course.name_ar ?? course.name}</option>)}
            </select>

            <div className="grid gap-3 md:grid-cols-2">
              <select value={form.registration_status} onChange={(event) => setForm({ ...form, registration_status: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
                <option value="registered">{tx("ظ…ط³ط¬ظ„", "Registered")}</option>
                <option value="pending">{tx("ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", "Pending")}</option>
                <option value="canceled">{tx("ظ…ظ„ط؛ظٹ", "Canceled")}</option>
              </select>
              <select value={form.payment_status} onChange={(event) => setForm({ ...form, payment_status: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
                <option value="unpaid">{tx("ط؛ظٹط± ظ…ط¯ظپظˆط¹", "Unpaid")}</option>
                <option value="partial">{tx("ط¯ظپط¹ ط¬ط²ط¦ظٹ", "Partial")}</option>
                <option value="paid">{tx("ظ…ط¯ظپظˆط¹", "Paid")}</option>
                <option value="refunded">{tx("ظ…ط³طھط±ط¯", "Refunded")}</option>
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.list_price} onChange={(event) => updateMoney("list_price", event.target.value)} type="number" placeholder={tx("ط§ظ„ط³ط¹ط±", "Price")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={form.discount_amount} onChange={(event) => updateMoney("discount_amount", event.target.value)} type="number" placeholder={tx("ط§ظ„ط®طµظ…", "Discount")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={form.final_price} readOnly type="number" placeholder={tx("ط§ظ„طµط§ظپظٹ", "Net")} className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-emerald-300 outline-none" />
              <input value={form.paid_amount} onChange={(event) => updateMoney("paid_amount", event.target.value)} type="number" placeholder={tx("ط§ظ„ظ…ط¯ظپظˆط¹", "Paid amount")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            </div>

            <input value={form.discount_code} onChange={(event) => setForm({ ...form, discount_code: event.target.value })} placeholder={tx("ظƒظˆط¯ ط§ظ„ط®طµظ…", "Discount code")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={tx("ظ…ظ„ط§ط­ط¸ط§طھ", "Notes")} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />

            {error ? <div className="flex gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><XCircle className="h-4 w-4" />{error}</div> : null}
            {message ? <div className="flex gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{message}</div> : null}

            <button onClick={saveRegistration} disabled={saving || !canEdit} type="button" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">
              <Save className="h-5 w-5" /> {saving ? tx("ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸...", "Saving...") : tx("ط­ظپط¸ ط§ظ„طھط³ط¬ظٹظ„", "Save registration")}
            </button>
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_240px]">
            <div className="relative"><Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tx("ط§ط¨ط­ط« ظپظٹ ط§ظ„طھط³ط¬ظٹظ„ط§طھ...", "Search registrations...")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-11 py-3 text-white outline-none focus:border-emerald-400" /></div>
            <select value={centerFilter} onChange={(event) => setCenterFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
              <option value="all">{tx("ظƒظ„ ظ…ط±ط§ظƒط² ط§ظ„طھط¯ط±ظٹط¨", "All centers")}</option>
              {trainingCenters.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
            </select>
          </div>

          <div className="grid gap-3">
            {filteredRegistrations.map((registration) => (
              <article key={registration.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 px-3 py-1 text-sky-300"><Building2 className="h-3 w-3" />{centerName(registration.company_id)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-300"><BookOpen className="h-3 w-3" />{courseName(registration.course_id)}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-white"><UserRound className="me-2 inline h-5 w-5 text-emerald-300" />{leadName(registration.lead_id)}</h2>
                    <p className="mt-1 text-sm text-slate-400">{tx("ط§ظ„ط³ظٹظ„ط²", "Sales")}: {salesName(registration.sales_id)}</p>
                    {registration.notes ? <p className="mt-3 rounded-2xl bg-white/[0.03] p-3 text-sm text-slate-300">{registration.notes}</p> : null}
                  </div>
                  <div className="min-w-52 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                    <p className="text-slate-400">{tx("ط§ظ„ط³ط¹ط±", "Price")}: <span className="text-white">{registration.list_price ?? 0}</span></p>
                    <p className="text-slate-400">{tx("ط§ظ„ط®طµظ…", "Discount")}: <span className="text-white">{registration.discount_amount ?? 0}</span></p>
                    <p className="text-slate-400">{tx("ط§ظ„طµط§ظپظٹ", "Net")}: <span className="font-black text-emerald-300">{registration.final_price ?? 0}</span></p>
                    <p className="text-slate-400">{tx("ط§ظ„ظ…ط¯ظپظˆط¹", "Paid")}: <span className="text-white">{registration.paid_amount ?? 0}</span></p>
                    {registration.discount_code ? <p className="text-slate-400">{tx("ط§ظ„ظƒظˆط¯", "Code")}: <span className="text-sky-300">{registration.discount_code}</span></p> : null}
                    <span className="mt-3 inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"><CreditCard className="me-1 h-3 w-3" />{registration.payment_status ?? "-"}</span>
                  </div>
                </div>
              </article>
            ))}

            {filteredRegistrations.length === 0 ? <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">{tx("ظ„ط§ طھظˆط¬ط¯ طھط³ط¬ظٹظ„ط§طھ ط¨ط¹ط¯.", "No registrations yet.")}</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-slate-400">{label}</p><h2 className="mt-2 text-3xl font-black text-white">{value}</h2></div>;
}
