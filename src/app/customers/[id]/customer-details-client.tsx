"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  country_code: string | null;
  phone_number: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  status: string | null;
  customer_status: string | null;
  priority: string | null;
  owner_id: string | null;
  program: string | null;
  course_id: string | null;
  lead_type: string | null;
  registration_status: string | null;
  payment_status: string | null;
  registration_amount: number | null;
  discount_amount: number | null;
  final_amount: number | null;
  paid_amount: number | null;
  discount_code: string | null;
  next_follow_up_at: string | null;
  last_contact_at: string | null;
  last_note: string | null;
  created_at: string | null;
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
  const isDeveloper = role === "developer";
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isModerator = role === "moderator";
  const isMarketer = role === "marketer";
  const isSales = role === "sales";
  const isFinance = role === "finance";

  return {
    isFullControl: isDeveloper || isAdmin,
    canEditBasic: isDeveloper || isAdmin || isManager || isModerator || isMarketer,
    canEditMarketing: isDeveloper || isAdmin || isManager || isModerator || isMarketer,
    canEditSalesFlow: isDeveloper || isAdmin || isManager || isModerator || isSales,
    canAssignOwner: isDeveloper || isAdmin || isManager || isModerator,
    canEditProtected: isDeveloper || isAdmin,
    canEditPayment: isDeveloper || isAdmin || isFinance,
    canEditRegistrations: isDeveloper || isAdmin || isManager || isFinance,
  };
}

function statusLabel(value?: string | null) {
  const map: Record<string, string> = {
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
    status_changed: "طھط؛ظٹظٹط± ط§ظ„ط­ط§ظ„ط©",
    followup_changed: "طھط­ط¯ظٹط¯ ظ…طھط§ط¨ط¹ط©",
    note_added: "ط¥ط¶ط§ظپط© ظ…ظ„ط§ط­ط¸ط©",
    customer_updated: "طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„",
    registration_updated: "طھط­ط¯ظٹط« ط§ظ„طھط³ط¬ظٹظ„",
    payment_updated: "طھط­ط¯ظٹط« ط§ظ„ط¯ظپط¹",
  };
  return value ? map[value] ?? value : "-";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "-";
  }
}

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function normalizePhone(countryCode: string, phoneNumber: string) {
  const code = (countryCode || "+966").trim().replace(/^00/, "+").replace(/[^\d+]/g, "");
  const number = (phoneNumber || "").replace(/\D/g, "").replace(/^0+/, "");
  const phone = `${code}${number}`.replace(/^\+/, "");
  return { country_code: code.startsWith("+") ? code : `+${code}`, phone_number: number, phone };
}

function money(value?: number | null) {
  return Number(value ?? 0).toFixed(2);
}

export function CustomerDetailsClient({
  initialLead,
  profiles,
  companies,
  courses,
  activities,
  initialRegistrations,
  currentUserId,
  currentUserName,
  role,
}: Props) {
  const supabase = createClient();
  const can = permissionsFor(role);
  const [lead, setLead] = useState<Lead>(initialLead);
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [timeline, setTimeline] = useState<Activity[]>(activities);
  const [saving, setSaving] = useState(false);
  const [savingRegistrationId, setSavingRegistrationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
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
      if (["registration_amount", "discount_amount"].includes(field)) {
        next.final_amount = String(Math.max(0, Number(next.registration_amount || 0) - Number(next.discount_amount || 0)).toFixed(2));
      }
      return next;
    });
  }

  function profileName(id?: string | null) {
    if (!id) return "ط؛ظٹط± ظ…ظˆط²ط¹";
    const profile = profiles.find((item) => item.id === id);
    return profile?.full_name ?? profile?.email ?? "ط؛ظٹط± ظ…ط¹ط±ظˆظپ";
  }

  function courseName(id?: string | null) {
    if (!id) return "-";
    const course = courses.find((item) => item.id === id);
    return course?.name_ar ?? course?.name ?? course?.name_en ?? id;
  }

  function centerName(id?: string | null) {
    if (!id) return "-";
    return companies.find((item) => item.id === id)?.name ?? id;
  }

  async function addActivity(action: string, oldValue: string | null, newValue: string | null, note: string | null) {
    const { data } = await supabase
      .from("customer_activities")
      .insert({
        lead_id: lead.id,
        actor_id: currentUserId,
        actor_name: currentUserName,
        action,
        old_value: oldValue,
        new_value: newValue,
        note,
      })
      .select("id,actor_name,action,old_value,new_value,note,created_at")
      .single();

    if (data) setTimeline((current) => [data as Activity, ...current]);
  }

  async function saveCustomer() {
    setMessage("");
    setError("");
    setSaving(true);

    const phone = normalizePhone(form.country_code, form.phone_number);
    const payload: Record<string, string | number | null> = {
      last_contact_at: new Date().toISOString(),
    };

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
      payload.program = form.program.trim() || courseName(form.course_id);
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
      payload.assigned_at = form.owner_id && form.owner_id !== lead.owner_id ? new Date().toISOString() : (lead as any).assigned_at ?? null;
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

    const { data, error } = await supabase.from("leads").update(payload).eq("id", lead.id).select("*").single();

    setSaving(false);

    if (error || !data) {
      setError(error?.message ?? "طھط¹ط°ط± ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„.");
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
    if (oldOwner !== newOwner) await addActivity("transferred", profileName(oldOwner), profileName(newOwner), "طھط؛ظٹظٹط± ط§ظ„ظ…ط³ط¤ظˆظ„ ط¹ظ† ط§ظ„ط¹ظ…ظٹظ„");
    if (form.last_note.trim()) await addActivity("note_added", null, null, form.last_note.trim());
    await addActivity("customer_updated", null, null, "طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ظ…ظ† طµظپط­ط© ط§ظ„ط¹ظ…ظٹظ„ ط§ظ„ظƒط§ظ…ظ„ط©");
  }

  function updateRegistrationField(id: string, field: keyof Registration, value: string) {
    setRegistrations((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [field]: value } as Registration;
        if (field === "list_price" || field === "discount_amount") {
          next.final_price = Math.max(0, Number(next.list_price ?? 0) - Number(next.discount_amount ?? 0));
        }
        return next;
      })
    );
  }

  async function saveRegistration(registration: Registration) {
    if (!can.canEditRegistrations && !can.canEditPayment) return;
    setSavingRegistrationId(registration.id);
    setMessage("");
    setError("");

    const updatePayload: Record<string, string | number | null> = {
      payment_status: registration.payment_status,
      paid_amount: Number(registration.paid_amount ?? 0),
      notes: registration.notes ?? null,
    };

    if (can.canEditRegistrations) {
      updatePayload.status = registration.status;
      updatePayload.list_price = Number(registration.list_price ?? 0);
      updatePayload.discount_amount = Number(registration.discount_amount ?? 0);
      updatePayload.final_price = Number(registration.final_price ?? 0);
      updatePayload.discount_code = registration.discount_code ?? null;
    }

    const { data, error } = await supabase
      .from("registrations")
      .update(updatePayload)
      .eq("id", registration.id)
      .select("id,lead_id,company_id,course_id,sales_id,status,payment_status,list_price,discount_amount,final_price,discount_code,paid_amount,notes,created_at")
      .single();

    setSavingRegistrationId(null);

    if (error || !data) {
      setError(error?.message ?? "طھط¹ط°ط± ط­ظپط¸ ط§ظ„طھط³ط¬ظٹظ„.");
      return;
    }

    setRegistrations((current) => current.map((item) => (item.id === registration.id ? (data as Registration) : item)));
    setMessage("طھظ… طھط­ط¯ظٹط« ط§ظ„طھط³ط¬ظٹظ„ ط¨ظ†ط¬ط§ط­.");
    await addActivity("registration_updated", null, registration.payment_status ?? null, "طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„طھط³ط¬ظٹظ„ ط£ظˆ ط§ظ„ط¯ظپط¹");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/customers" className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
          ط±ط¬ظˆط¹ ظ„ظ„ط¹ظ…ظ„ط§ط،
        </Link>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
          طµظ„ط§ط­ظٹطھظƒ ط§ظ„ط­ط§ظ„ظٹط©: {statusLabel(role)} {can.isFullControl ? "â€” طھط­ظƒظ… ظƒط§ظ…ظ„" : ""}
        </div>
      </div>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">طµظپط­ط© ط§ظ„ط¹ظ…ظٹظ„ ط§ظ„ظƒط§ظ…ظ„ط©</p>
        <h1 className="mt-2 text-3xl font-black text-white">{lead.full_name ?? "ط¨ط¯ظˆظ† ط§ط³ظ…"}</h1>
        <p className="mt-2 text-sm text-slate-400">ظƒظ„ طھط¹ط¯ظٹظ„ ظٹط¸ظ‡ط± ط­ط³ط¨ طµظ„ط§ط­ظٹط© ط§ظ„ظ…ط³طھط®ط¯ظ…. ط§ظ„ظ…ط¯ظٹط± ط§ظ„ط¹ط§ظ… ظˆظ…ط·ظˆط± ط§ظ„ظ†ط¸ط§ظ… ظٹظ…ظ„ظƒظˆظ† طھط¹ط¯ظٹظ„ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط­ظ…ظٹط©.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="ط§ظ„ط­ط§ظ„ط©" value={statusLabel(lead.customer_status ?? lead.status)} />
          <Stat label="ط§ظ„ظ…ط³ط¤ظˆظ„" value={profileName(lead.owner_id)} />
          <Stat label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھط³ط¬ظٹظ„ط§طھ" value={money(totals.total)} />
          <Stat label="ط§ظ„ظ…طھط¨ظ‚ظٹ" value={money(totals.remaining)} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-2xl font-black text-white">ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„" value={form.full_name} onChange={(value) => setField("full_name", value)} disabled={!can.canEditBasic} />
            <Field label="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" value={form.email} onChange={(value) => setField("email", value)} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="ظƒظˆط¯ ط§ظ„ط¯ظˆظ„ط©" value={form.country_code} onChange={(value) => setField("country_code", value)} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„" value={form.phone_number} onChange={(value) => setField("phone_number", value.replace(/\D/g, ""))} disabled={!can.canEditBasic} dir="ltr" />

            <Field label="ط§ظ„ظ…طµط¯ط± / ط§ظ„ط­ظ…ظ„ط©" value={form.source} onChange={(value) => setField("source", value)} disabled={!can.canEditMarketing} />
            <Select label="ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„" value={form.lead_type} onChange={(value) => setField("lead_type", value)} disabled={!can.canEditMarketing} options={leadTypeOptions.map((value) => ({ value, label: statusLabel(value) }))} />
            <Field label="ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨ ط§ظ„ظ…ط¨ط¯ط¦ظٹ" value={form.company_name} onChange={(value) => setField("company_name", value)} disabled={!can.canEditMarketing} />
            <Field label="ط§ظ„ط¯ظˆط±ط© ط§ظ„ظ…ط¨ط¯ط¦ظٹط©" value={form.program} onChange={(value) => setField("program", value)} disabled={!can.canEditMarketing} />

            <Select label="ط§ط®طھظٹط§ط± ط¯ظˆط±ط© ظ…ظ† ط§ظ„ظ†ط¸ط§ظ…" value={form.course_id} onChange={(value) => setField("course_id", value)} disabled={!can.canEditMarketing} options={[{ value: "", label: "ط¨ط¯ظˆظ† ط¯ظˆط±ط©" }, ...courses.map((course) => ({ value: course.id, label: course.name_ar ?? course.name ?? course.name_en ?? course.id }))]} />
            <Select label="ط­ط§ظ„ط© ط§ظ„ط¹ظ…ظٹظ„" value={form.status} onChange={(value) => setField("status", value)} disabled={!can.canEditSalesFlow} options={statusOptions.map((value) => ({ value, label: statusLabel(value) }))} />
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
                <Select label="ط­ط§ظ„ط© ط§ظ„طھط³ط¬ظٹظ„" value={form.registration_status} onChange={(value) => setField("registration_status", value)} disabled={!can.canEditProtected} options={registrationStatusOptions.map((value) => ({ value, label: statusLabel(value) }))} />
                <Select label="ط­ط§ظ„ط© ط§ظ„ط¯ظپط¹" value={form.payment_status} onChange={(value) => setField("payment_status", value)} disabled={!can.canEditPayment && !can.canEditProtected} options={paymentStatusOptions.map((value) => ({ value, label: statusLabel(value) }))} />
                <Field label="ظ‚ظٹظ…ط© ط§ظ„طھط³ط¬ظٹظ„" type="number" value={form.registration_amount} onChange={(value) => setField("registration_amount", value)} disabled={!can.canEditPayment && !can.canEditProtected} />
                <Field label="ط§ظ„ط®طµظ…" type="number" value={form.discount_amount} onChange={(value) => setField("discount_amount", value)} disabled={!can.canEditPayment && !can.canEditProtected} />
                <Field label="ط§ظ„طµط§ظپظٹ" type="number" value={form.final_amount} onChange={(value) => setField("final_amount", value)} disabled={!can.canEditPayment && !can.canEditProtected} />
                <Field label="ط§ظ„ظ…ط¯ظپظˆط¹" type="number" value={form.paid_amount} onChange={(value) => setField("paid_amount", value)} disabled={!can.canEditPayment && !can.canEditProtected} />
                <Field label="ظƒظˆط¯ ط§ظ„ط®طµظ…" value={form.discount_code} onChange={(value) => setField("discount_code", value)} disabled={!can.canEditPayment && !can.canEditProtected} />
              </div>
            </div>
          ) : null}

          {message ? <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}

          <button onClick={saveCustomer} disabled={saving || (!can.canEditBasic && !can.canEditMarketing && !can.canEditSalesFlow && !can.canEditProtected && !can.canEditPayment)} type="button" className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
            {saving ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "ط­ظپط¸ طھط¹ط¯ظٹظ„ط§طھ ط§ظ„ط¹ظ…ظٹظ„"}
          </button>
        </div>

        <aside className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-2xl font-black text-white">ظ…ظ„ط®طµ ط³ط±ظٹط¹</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Info label="طھط§ط±ظٹط® ط§ظ„ط¥ط¶ط§ظپط©" value={formatDate(lead.created_at)} />
            <Info label="ط¢ط®ط± طھظˆط§طµظ„" value={formatDate(lead.last_contact_at)} />
            <Info label="ط§ظ„ظ…طھط§ط¨ط¹ط©" value={formatDate(lead.next_follow_up_at)} />
            <Info label="ط§ظ„ط¯ظˆط±ط©" value={courseName(lead.course_id)} />
            <Info label="ط§ظ„ط¹ظ…ظٹظ„" value={statusLabel(lead.lead_type)} />
          </div>
        </aside>
      </section>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-emerald-300">ظ…ظ† ط§ظ„طھط³ط¬ظٹظ„ ظ„ظ„ط¯ظپط¹</p>
            <h2 className="text-2xl font-black text-white">طھط³ط¬ظٹظ„ط§طھ ط§ظ„ط¹ظ…ظٹظ„</h2>
          </div>
          <Link href={`/registrations?lead=${lead.id}`} className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300">
            طھط³ط¬ظٹظ„ ظپظٹ ط¯ظˆط±ط©
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {registrations.length ? registrations.map((registration) => (
            <article key={registration.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Info label="ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨" value={centerName(registration.company_id)} />
                <Info label="ط§ظ„ط¯ظˆط±ط©" value={courseName(registration.course_id)} />
                <Select label="ط­ط§ظ„ط© ط§ظ„طھط³ط¬ظٹظ„" value={registration.status ?? "registered"} onChange={(value) => updateRegistrationField(registration.id, "status", value)} disabled={!can.canEditRegistrations} options={registrationStatusOptions.map((value) => ({ value, label: statusLabel(value) }))} />
                <Select label="ط­ط§ظ„ط© ط§ظ„ط¯ظپط¹" value={registration.payment_status ?? "unpaid"} onChange={(value) => updateRegistrationField(registration.id, "payment_status", value)} disabled={!can.canEditPayment && !can.canEditRegistrations} options={paymentStatusOptions.map((value) => ({ value, label: statusLabel(value) }))} />
                <Field label="ط§ظ„ط³ط¹ط±" type="number" value={String(registration.list_price ?? 0)} onChange={(value) => updateRegistrationField(registration.id, "list_price", value)} disabled={!can.canEditRegistrations} />
                <Field label="ط§ظ„ط®طµظ…" type="number" value={String(registration.discount_amount ?? 0)} onChange={(value) => updateRegistrationField(registration.id, "discount_amount", value)} disabled={!can.canEditRegistrations} />
                <Field label="ط§ظ„طµط§ظپظٹ" type="number" value={String(registration.final_price ?? 0)} onChange={(value) => updateRegistrationField(registration.id, "final_price", value)} disabled={!can.canEditRegistrations} />
                <Field label="ط§ظ„ظ…ط¯ظپظˆط¹" type="number" value={String(registration.paid_amount ?? 0)} onChange={(value) => updateRegistrationField(registration.id, "paid_amount", value)} disabled={!can.canEditPayment && !can.canEditRegistrations} />
                <Field label="ظƒظˆط¯ ط§ظ„ط®طµظ…" value={registration.discount_code ?? ""} onChange={(value) => updateRegistrationField(registration.id, "discount_code", value)} disabled={!can.canEditRegistrations} />
                <Textarea label="ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„طھط³ط¬ظٹظ„" value={registration.notes ?? ""} onChange={(value) => updateRegistrationField(registration.id, "notes", value)} disabled={!can.canEditRegistrations && !can.canEditPayment} />
              </div>
              {(can.canEditRegistrations || can.canEditPayment) ? (
                <button onClick={() => saveRegistration(registration)} disabled={savingRegistrationId === registration.id} type="button" className="mt-4 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-50">
                  {savingRegistrationId === registration.id ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "ط­ظپط¸ ط§ظ„طھط³ط¬ظٹظ„"}
                </button>
              ) : null}
            </article>
          )) : <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">ظ„ط§ طھظˆط¬ط¯ طھط³ط¬ظٹظ„ط§طھ ظ„ظ‡ط°ط§ ط§ظ„ط¹ظ…ظٹظ„ ط­طھظ‰ ط§ظ„ط¢ظ†.</div>}
        </div>
      </section>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-2xl font-black text-white">ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„</h2>
        <div className="mt-5 space-y-3">
          {timeline.length ? timeline.map((activity) => (
            <div key={activity.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-black text-white">{statusLabel(activity.action)}</p>
                <span className="text-xs text-slate-500">{formatDate(activity.created_at)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">ط¨ظˆط§ط³ط·ط©: {activity.actor_name ?? "ط§ظ„ظ†ط¸ط§ظ…"}</p>
              {(activity.old_value || activity.new_value) ? <p className="mt-2 text-sm text-slate-300">{statusLabel(activity.old_value)} â†گ {statusLabel(activity.new_value)}</p> : null}
              {activity.note ? <p className="mt-2 leading-7 text-slate-300">{activity.note}</p> : null}
            </div>
          )) : <p className="text-slate-400">ظ„ط§ طھظˆط¬ط¯ ط£ط­ط¯ط§ط« ظ…ط³ط¬ظ„ط© ظ„ظ‡ط°ط§ ط§ظ„ط¹ظ…ظٹظ„ ط­طھظ‰ ط§ظ„ط¢ظ†.</p>}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-bold text-slate-100">{value}</p></div>;
}

function Field({ label, value, onChange, disabled, type = "text", dir }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; type?: string; dir?: "ltr" | "rtl" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} dir={dir} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50" />
    </label>
  );
}

function Textarea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 block text-xs text-slate-500">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50" />
    </label>
  );
}

function Select({ label, value, onChange, disabled, options }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
        {options.map((option) => <option key={option.value || "empty"} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
