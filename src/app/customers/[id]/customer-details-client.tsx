"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  customer_code?: string | null;
  full_name: string | null;
  phone?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email?: string | null;
  company_name?: string | null;
  source?: string | null;
  status?: string | null;
  customer_status?: string | null;
  priority?: string | null;
  owner_id?: string | null;
  program?: string | null;
  course_id?: string | null;
  lead_type?: string | null;
  registration_status?: string | null;
  payment_status?: string | null;
  registration_amount?: number | null;
  discount_amount?: number | null;
  final_amount?: number | null;
  paid_amount?: number | null;
  discount_code?: string | null;
  next_follow_up_at?: string | null;
  last_contact_at?: string | null;
  last_note?: string | null;
  created_at?: string | null;
};

type Profile = { id: string; full_name: string | null; email: string | null; role: string | null; is_active: boolean | null };
type Company = { id: string; name: string | null };
type Course = { id: string; name: string | null; name_ar: string | null; name_en: string | null; company_id: string | null; price: number | null; sale_price: number | null };
type Activity = { id: string; actor_name: string | null; action: string; old_value: string | null; new_value: string | null; note: string | null; created_at: string | null };
type Registration = { id: string; lead_id: string | null; company_id: string | null; course_id: string | null; sales_id: string | null; status: string | null; payment_status: string | null; list_price: number | null; discount_amount: number | null; final_price: number | null; discount_code: string | null; paid_amount: number | null; notes: string | null; created_at: string | null };

type Props = {
  initialLead: Lead;
  profiles: Profile[];
  companies: Company[];
  courses: Course[];
  activities: Activity[];
  initialRegistrations: Registration[];
  currentUserId: string;
  currentUserName: string;
  role: string | null;
};

const statusOptions = ["interested", "not_interested", "need_offer", "missed", "wrong_number", "paid", "busy"];
const leadTypeOptions = ["fresh", "retargeted", "redirected"];
const registrationStatusOptions = ["not_registered", "registered", "pending", "canceled"];
const paymentStatusOptions = ["unpaid", "partial", "paid", "refunded"];

function permissionsFor(role: string | null) {
  const full = role === "developer" || role === "admin";
  return {
    full,
    canEditBasic: full || role === "manager" || role === "moderator" || role === "marketer",
    canEditMarketing: full || role === "manager" || role === "moderator" || role === "marketer",
    canEditSalesFlow: full || role === "manager" || role === "moderator" || role === "sales",
    canAssignOwner: full || role === "manager" || role === "moderator",
    canEditPayment: full || role === "finance",
    canEditProtected: full,
  };
}

function label(value?: string | null) {
  const map: Record<string, string> = {
    developer: "ظ…ط·ظˆط± ط§ظ„ظ†ط¸ط§ظ…",
    admin: "ط§ظ„ظ…ط¯ظٹط± ط§ظ„ط¹ط§ظ…",
    manager: "طھظٹظ… ظ„ظٹط¯ط± ط³ظٹظ„ط²",
    moderator: "ط§ظ„ظ…ظˆط¯ظٹط±ظٹطھظˆط±",
    marketer: "ط§ظ„ظ…ط³ظˆظ‚",
    sales: "ط³ظٹظ„ط²",
    finance: "ظ…ط§ظ„ظٹط© / ط­ط³ط§ط¨ط§طھ",
    data_analyst: "ظ…ط­ظ„ظ„ ط¨ظٹط§ظ†ط§طھ",
    interested: "ظ…ظ‡طھظ…",
    not_interested: "ط؛ظٹط± ظ…ظ‡طھظ…",
    need_offer: "ظٹط­طھط§ط¬ ط¹ط±ط¶",
    missed: "ظ„ظ… ظٹط±ط¯",
    wrong_number: "ط±ظ‚ظ… ط®ط·ط£",
    paid: "ظ…ط¯ظپظˆط¹",
    busy: "ظ…ط´ط؛ظˆظ„",
    not_registered: "ط؛ظٹط± ظ…ط³ط¬ظ„",
    registered: "ظ…ط³ط¬ظ„",
    pending: "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©",
    canceled: "ظ…ظ„ط؛ظٹ",
    unpaid: "ط؛ظٹط± ظ…ط¯ظپظˆط¹",
    partial: "ط¯ظپط¹ ط¬ط²ط¦ظٹ",
    refunded: "ظ…ط³طھط±ط¯",
    fresh: "ط¬ط¯ظٹط¯",
    retargeted: "ط¥ط¹ط§ط¯ط© ط§ط³طھظ‡ط¯ط§ظپ",
    redirected: "ظ…ط­ظˆظ„",
    customer_updated: "طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„",
    status_changed: "طھط؛ظٹظٹط± ط§ظ„ط­ط§ظ„ط©",
    transferred: "طھط؛ظٹظٹط± ط§ظ„ظ…ط³ط¤ظˆظ„",
    note_added: "ط¥ط¶ط§ظپط© ظ…ظ„ط§ط­ط¸ط©",
    registration_updated: "طھط­ط¯ظٹط« ط§ظ„طھط³ط¬ظٹظ„",
  };
  return value ? map[value] ?? value : "-";
}

function money(value?: number | null) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "-";
  }
}

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function normalizePhone(countryCode: string, phoneNumber: string) {
  const code = (countryCode || "+966").trim().replace(/^00/, "+").replace(/[^\d+]/g, "");
  const number = (phoneNumber || "").replace(/\D/g, "").replace(/^0+/, "");
  return { country_code: code.startsWith("+") ? code : `+${code}`, phone_number: number, phone: `${code}${number}`.replace(/^\+/, "") };
}

function courseName(courses: Course[], id?: string | null) {
  const course = courses.find((item) => item.id === id);
  return course?.name_ar ?? course?.name ?? course?.name_en ?? id ?? "-";
}

function centerName(companies: Company[], id?: string | null) {
  return companies.find((item) => item.id === id)?.name ?? "-";
}

function profileName(profiles: Profile[], id?: string | null) {
  if (!id) return "ط؛ظٹط± ظ…ظˆط²ط¹";
  const profile = profiles.find((item) => item.id === id);
  return profile?.full_name ?? profile?.email ?? "ط؛ظٹط± ظ…ط¹ط±ظˆظپ";
}

export function CustomerDetailsClient({ initialLead, profiles, companies, courses, activities, initialRegistrations, currentUserId, currentUserName, role }: Props) {
  const supabase = createClient();
  const can = permissionsFor(role);
  const [lead, setLead] = useState<Lead>(initialLead);
  const [timeline, setTimeline] = useState<Activity[]>(activities);
  const [registrations] = useState<Registration[]>(initialRegistrations);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customer_code: initialLead.customer_code ?? "",
    full_name: initialLead.full_name ?? "",
    country_code: initialLead.country_code ?? "+966",
    phone_number: initialLead.phone_number ?? "",
    email: initialLead.email ?? "",
    source: initialLead.source ?? "",
    lead_type: initialLead.lead_type ?? "fresh",
    company_name: initialLead.company_name ?? "",
    program: initialLead.program ?? "",
    course_id: initialLead.course_id ?? "",
    status: initialLead.customer_status ?? initialLead.status ?? "interested",
    priority: initialLead.priority ?? "medium",
    owner_id: initialLead.owner_id ?? "",
    registration_status: initialLead.registration_status ?? "not_registered",
    payment_status: initialLead.payment_status ?? "unpaid",
    registration_amount: String(initialLead.registration_amount ?? 0),
    discount_amount: String(initialLead.discount_amount ?? 0),
    final_amount: String(initialLead.final_amount ?? 0),
    paid_amount: String(initialLead.paid_amount ?? 0),
    discount_code: initialLead.discount_code ?? "",
    next_follow_up_at: toInputDateTime(initialLead.next_follow_up_at),
    last_note: initialLead.last_note ?? "",
  });

  const totals = useMemo(() => {
    const total = registrations.reduce((sum, item) => sum + Number(item.final_price ?? 0), 0);
    const paid = registrations.reduce((sum, item) => sum + Number(item.paid_amount ?? 0), 0);
    return { total, paid, remaining: Math.max(0, total - paid) };
  }, [registrations]);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "registration_amount" || field === "discount_amount") {
        next.final_amount = String(Math.max(0, Number(next.registration_amount || 0) - Number(next.discount_amount || 0)).toFixed(2));
      }
      return next;
    });
  }

  async function addActivity(action: string, oldValue: string | null, newValue: string | null, note: string | null) {
    const { data } = await supabase
      .from("customer_activities")
      .insert({ lead_id: lead.id, actor_id: currentUserId, actor_name: currentUserName, action, old_value: oldValue, new_value: newValue, note })
      .select("id,actor_name,action,old_value,new_value,note,created_at")
      .single();

    if (data) setTimeline((current) => [data as Activity, ...current]);
  }

  async function saveCustomer() {
    setMessage("");
    setError("");
    setSaving(true);

    const phone = normalizePhone(form.country_code, form.phone_number);
    const payload: Record<string, string | number | null> = { last_contact_at: new Date().toISOString() };

    if (can.canEditBasic) {
      payload.full_name = form.full_name.trim() || null;
      payload.country_code = phone.country_code;
      payload.phone_number = phone.phone_number || null;
      payload.phone = phone.phone || null;
      payload.email = form.email.trim() || null;
    }

    if (can.canEditMarketing) {
      payload.source = form.source.trim() || null;
      payload.lead_type = form.lead_type;
      payload.company_name = form.company_name.trim() || null;
      payload.program = form.program.trim() || courseName(courses, form.course_id);
      payload.course_id = form.course_id || null;
    }

    if (can.canEditSalesFlow) {
      payload.status = form.status;
      payload.customer_status = form.status;
      payload.priority = form.priority;
      payload.next_follow_up_at = form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null;
      payload.last_note = form.last_note.trim() || null;
      payload.status_updated_at = new Date().toISOString();
    }

    if (can.canAssignOwner) {
      payload.owner_id = form.owner_id || null;
      payload.assigned_at = form.owner_id && form.owner_id !== lead.owner_id ? new Date().toISOString() : null;
    }

    if (can.canEditProtected || can.canEditPayment) {
      payload.registration_status = form.registration_status;
      payload.payment_status = form.payment_status;
      payload.registration_amount = Number(form.registration_amount || 0);
      payload.discount_amount = Number(form.discount_amount || 0);
      payload.final_amount = Number(form.final_amount || 0);
      payload.paid_amount = Number(form.paid_amount || 0);
      payload.discount_code = form.discount_code.trim() || null;
    }

    if (can.canEditProtected && form.customer_code.trim()) {
      payload.customer_code = form.customer_code.trim();
    }

    const { data, error: updateError } = await supabase.from("leads").update(payload).eq("id", lead.id).select("*").single();
    setSaving(false);

    if (updateError || !data) {
      setError(updateError?.message ?? "طھط¹ط°ط± ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„.");
      return;
    }

    const updated = data as Lead;
    const oldStatus = lead.customer_status ?? lead.status ?? "";
    const newStatus = updated.customer_status ?? updated.status ?? "";
    const oldOwner = lead.owner_id ?? "";
    const newOwner = updated.owner_id ?? "";

    setLead(updated);
    setMessage("طھظ… ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ط¨ظ†ط¬ط§ط­.");

    if (oldStatus !== newStatus) await addActivity("status_changed", oldStatus, newStatus, form.last_note || null);
    if (oldOwner !== newOwner) await addActivity("transferred", profileName(profiles, oldOwner), profileName(profiles, newOwner), "طھط؛ظٹظٹط± ط§ظ„ظ…ط³ط¤ظˆظ„ ط¹ظ† ط§ظ„ط¹ظ…ظٹظ„");
    if (form.last_note.trim()) await addActivity("note_added", null, null, form.last_note.trim());
    await addActivity("customer_updated", null, null, "طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ظ…ظ† طµظپط­ط© ط§ظ„ط¹ظ…ظٹظ„ ط§ظ„ظƒط§ظ…ظ„ط©");
  }

  const phoneDisplay = lead.phone_number ? `${lead.country_code ?? ""} ${lead.phone_number}` : lead.phone ?? "-";
  const customerCode = lead.customer_code ?? form.customer_code ?? "-";

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/customers" className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
          ط±ط¬ظˆط¹ ظ„ظ„ط¹ظ…ظ„ط§ط،
        </Link>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
          طµظ„ط§ط­ظٹطھظƒ ط§ظ„ط­ط§ظ„ظٹط©: {label(role)} {can.full ? "â€” طھط­ظƒظ… ظƒط§ظ…ظ„" : ""}
        </div>
      </div>

      {(message || error) ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}`}>
          {error || message}
        </div>
      ) : null}

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">طµظپط­ط© ط§ظ„ط¹ظ…ظٹظ„ ط§ظ„ظƒط§ظ…ظ„ط©</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">{lead.full_name ?? "ط¨ط¯ظˆظ† ط§ط³ظ…"}</h1>
            <p className="mt-2 text-sm text-slate-400">ظƒظˆط¯ ط§ظ„ط¹ظ…ظٹظ„: <span className="font-bold text-white" dir="ltr">{customerCode}</span></p>
          </div>
          <Link href={`/registrations?leadId=${lead.id}`} className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300">
            طھط³ط¬ظٹظ„ ظپظٹ ط¯ظˆط±ط©
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="ط§ظ„ط­ط§ظ„ط©" value={label(lead.customer_status ?? lead.status)} />
          <Stat label="ط§ظ„ظ…ط³ط¤ظˆظ„" value={profileName(profiles, lead.owner_id)} />
          <Stat label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھط³ط¬ظٹظ„ط§طھ" value={money(totals.total)} />
          <Stat label="ط§ظ„ظ…طھط¨ظ‚ظٹ" value={money(totals.remaining)} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-2xl font-black text-white">ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="ظƒظˆط¯ ط§ظ„ط¹ظ…ظٹظ„" value={form.customer_code} onChange={(value) => setField("customer_code", value)} disabled={!can.canEditProtected} dir="ltr" />
            <Field label="ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„" value={form.full_name} onChange={(value) => setField("full_name", value)} disabled={!can.canEditBasic} />
            <Field label="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" value={form.email} onChange={(value) => setField("email", value)} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="ظƒظˆط¯ ط§ظ„ط¯ظˆظ„ط©" value={form.country_code} onChange={(value) => setField("country_code", value)} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„" value={form.phone_number} onChange={(value) => setField("phone_number", value.replace(/\D/g, ""))} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="ط§ظ„ط¬ظˆط§ظ„ ط§ظ„ط­ط§ظ„ظٹ" value={phoneDisplay} onChange={() => null} disabled dir="ltr" />
            <Field label="ط§ظ„ظ…طµط¯ط± / ط§ظ„ط­ظ…ظ„ط©" value={form.source} onChange={(value) => setField("source", value)} disabled={!can.canEditMarketing} />
            <Select label="ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„" value={form.lead_type} onChange={(value) => setField("lead_type", value)} disabled={!can.canEditMarketing} options={leadTypeOptions.map((value) => ({ value, label: label(value) }))} />
            <Field label="ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨ ط§ظ„ظ…ط¨ط¯ط¦ظٹ" value={form.company_name} onChange={(value) => setField("company_name", value)} disabled={!can.canEditMarketing} />
            <Field label="ط§ظ„ط¯ظˆط±ط© ط§ظ„ظ…ط¨ط¯ط¦ظٹط©" value={form.program} onChange={(value) => setField("program", value)} disabled={!can.canEditMarketing} />
            <Select label="ط§ط®طھظٹط§ط± ط¯ظˆط±ط© ظ…ظ† ط§ظ„ظ†ط¸ط§ظ…" value={form.course_id} onChange={(value) => setField("course_id", value)} disabled={!can.canEditMarketing} options={[{ value: "", label: "ط¨ط¯ظˆظ† ط¯ظˆط±ط©" }, ...courses.map((course) => ({ value: course.id, label: course.name_ar ?? course.name ?? course.name_en ?? course.id }))]} />
            <Select label="ط­ط§ظ„ط© ط§ظ„ط¹ظ…ظٹظ„" value={form.status} onChange={(value) => setField("status", value)} disabled={!can.canEditSalesFlow} options={statusOptions.map((value) => ({ value, label: label(value) }))} />
            <Field label="ظ…ظˆط¹ط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©" type="datetime-local" value={form.next_follow_up_at} onChange={(value) => setField("next_follow_up_at", value)} disabled={!can.canEditSalesFlow} />
            <Select label="ط§ظ„ظ…ط³ط¤ظˆظ„ ط¹ظ† ط§ظ„ط¹ظ…ظٹظ„" value={form.owner_id} onChange={(value) => setField("owner_id", value)} disabled={!can.canAssignOwner} options={[{ value: "", label: "ط؛ظٹط± ظ…ظˆط²ط¹" }, ...profiles.filter((profile) => ["sales", "manager", "moderator", "admin"].includes(profile.role ?? "")).map((profile) => ({ value: profile.id, label: profile.full_name ?? profile.email ?? profile.id }))]} />
          </div>

          <div className="mt-3">
            <Textarea label="ط¢ط®ط± ظ…ظ„ط§ط­ط¸ط©" value={form.last_note} onChange={(value) => setField("last_note", value)} disabled={!can.canEditSalesFlow} />
          </div>

          {(can.canEditProtected || can.canEditPayment) ? (
            <div className="mt-5 rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="mb-3 font-black text-amber-100">ط­ظ‚ظˆظ„ ظ…ط­ظ…ظٹط© ظ„ظ„ط¥ط¯ط§ط±ط© ظˆط§ظ„ظ…ط§ظ„ظٹط©</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Select label="ط­ط§ظ„ط© ط§ظ„طھط³ط¬ظٹظ„" value={form.registration_status} onChange={(value) => setField("registration_status", value)} disabled={!can.canEditProtected} options={registrationStatusOptions.map((value) => ({ value, label: label(value) }))} />
                <Select label="ط­ط§ظ„ط© ط§ظ„ط¯ظپط¹" value={form.payment_status} onChange={(value) => setField("payment_status", value)} disabled={!can.canEditPayment && !can.canEditProtected} options={paymentStatusOptions.map((value) => ({ value, label: label(value) }))} />
                <Field label="ط§ظ„ط³ط¹ط±" value={form.registration_amount} onChange={(value) => setField("registration_amount", value)} disabled={!can.canEditProtected} dir="ltr" />
                <Field label="ط§ظ„ط®طµظ…" value={form.discount_amount} onChange={(value) => setField("discount_amount", value)} disabled={!can.canEditProtected} dir="ltr" />
                <Field label="ط§ظ„طµط§ظپظٹ" value={form.final_amount} onChange={(value) => setField("final_amount", value)} disabled={!can.canEditProtected} dir="ltr" />
                <Field label="ط§ظ„ظ…ط¯ظپظˆط¹" value={form.paid_amount} onChange={(value) => setField("paid_amount", value)} disabled={!can.canEditPayment && !can.canEditProtected} dir="ltr" />
                <Field label="ظƒظˆط¯ ط§ظ„ط®طµظ…" value={form.discount_code} onChange={(value) => setField("discount_code", value)} disabled={!can.canEditProtected} dir="ltr" />
              </div>
            </div>
          ) : null}

          <button type="button" onClick={saveCustomer} disabled={saving} className="mt-5 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
            {saving ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ"}
          </button>
        </div>

        <aside className="space-y-4">
          <InfoCard title="ظ…ظ„ط®طµ ط§ظ„ط¹ظ…ظٹظ„" items={[
            ["طھط§ط±ظٹط® ط§ظ„ط¥ط¶ط§ظپط©", dateLabel(lead.created_at)],
            ["ط¢ط®ط± طھظˆط§طµظ„", dateLabel(lead.last_contact_at)],
            ["ط§ظ„ظ…طھط§ط¨ط¹ط© ط§ظ„ظ‚ط§ط¯ظ…ط©", dateLabel(lead.next_follow_up_at)],
            ["ط§ظ„ط¯ظˆط±ط©", courseName(courses, lead.course_id) || lead.program || "-"],
            ["ط§ظ„ظ…طµط¯ط±", lead.source ?? "-"],
          ]} />
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-2xl font-black text-white">ط§ظ„طھط³ط¬ظٹظ„ط§طھ ظˆط§ظ„ظ…ط¯ظپظˆط¹ط§طھ</h2>
          <div className="space-y-3">
            {registrations.length ? registrations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{courseName(courses, item.course_id)}</p>
                    <p className="mt-1 text-sm text-slate-400">{centerName(companies, item.company_id)}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{label(item.payment_status)}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                  <p>ط§ظ„ط³ط¹ط±: {money(item.list_price)}</p>
                  <p>ط§ظ„ط®طµظ…: {money(item.discount_amount)}</p>
                  <p>ط§ظ„ظ…ط¯ظپظˆط¹: {money(item.paid_amount)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">ظ„ط§ طھظˆط¬ط¯ طھط³ط¬ظٹظ„ط§طھ ظ„ظ‡ط°ط§ ط§ظ„ط¹ظ…ظٹظ„ ط­طھظ‰ ط§ظ„ط¢ظ†.</p>}
          </div>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-2xl font-black text-white">ط³ط¬ظ„ ط§ظ„ظ†ط´ط§ط·</h2>
          <div className="space-y-3">
            {timeline.length ? timeline.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="font-bold text-white">{label(item.action)}</p>
                <p className="mt-1 text-sm text-slate-400">{item.note ?? `${item.old_value ?? "-"} â†’ ${item.new_value ?? "-"}`}</p>
                <p className="mt-2 text-xs text-slate-500">{item.actor_name ?? "ط§ظ„ظ†ط¸ط§ظ…"} â€” {dateLabel(item.created_at)}</p>
              </div>
            )) : <p className="text-sm text-slate-400">ظ„ط§ ظٹظˆط¬ط¯ ظ†ط´ط§ط· ظ…ط³ط¬ظ„.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, disabled, type = "text", dir }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; type?: string; dir?: "ltr" | "rtl" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} dir={dir} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50" />
    </label>
  );
}

function Textarea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50" />
    </label>
  );
}

function Select({ label, value, onChange, disabled, options }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function InfoCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
      <h3 className="mb-4 text-xl font-black text-white">{title}</h3>
      <div className="space-y-3">
        {items.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">{key}</p>
            <p className="mt-1 font-bold text-slate-200">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}