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
const paymentStatusOptions = ["unpaid", "partial", "paid", "refunded"];
const registrationStatusOptions = ["not_registered", "registered", "pending", "canceled"];

function permissionsFor(role: string | null) {
  return {
    fullControl: role === "developer" || role === "admin",
    canEditBasic: ["developer", "admin", "manager", "moderator", "marketer"].includes(role ?? ""),
    canEditMarketing: ["developer", "admin", "manager", "moderator", "marketer"].includes(role ?? ""),
    canEditSales: ["developer", "admin", "manager", "moderator", "sales"].includes(role ?? ""),
    canAssign: ["developer", "admin", "manager", "moderator"].includes(role ?? ""),
    canEditFinance: ["developer", "admin", "finance"].includes(role ?? ""),
  };
}

function label(value?: string | null) {
  const map: Record<string, string> = {
    developer: "مطور النظام",
    admin: "المدير العام",
    manager: "تيم ليدر سيلز",
    moderator: "الموديريتور",
    marketer: "المسوق",
    sales: "سيلز",
    finance: "مالية / حسابات",
    interested: "مهتم",
    not_interested: "غير مهتم",
    need_offer: "يحتاج عرض",
    missed: "لم يرد",
    wrong_number: "رقم خطأ",
    paid: "مدفوع",
    busy: "مشغول",
    fresh: "جديد",
    retargeted: "إعادة استهداف",
    redirected: "محول",
    not_registered: "غير مسجل",
    registered: "مسجل",
    pending: "قيد المراجعة",
    canceled: "ملغي",
    unpaid: "غير مدفوع",
    partial: "دفع جزئي",
    refunded: "مسترد",
    status_changed: "تغيير الحالة",
    note_added: "إضافة ملاحظة",
    customer_updated: "تحديث بيانات العميل",
    registration_updated: "تحديث التسجيل",
    payment_updated: "تحديث الدفع",
  };
  return value ? map[value] ?? value : "-";
}

function money(value?: number | null) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(Number(value ?? 0));
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
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function normalizePhone(countryCode: string, phoneNumber: string) {
  const code = (countryCode || "+966").trim().replace(/^00/, "+").replace(/[^\d+]/g, "");
  const number = (phoneNumber || "").replace(/\D/g, "").replace(/^0+/, "");
  const cleanCode = code.startsWith("+") ? code : `+${code}`;
  return { country_code: cleanCode, phone_number: number, phone: `${cleanCode}${number}`.replace(/^\+/, "") };
}

export function CustomerDetailsClient({ initialLead, profiles, companies, courses, activities, initialRegistrations, currentUserId, currentUserName, role }: Props) {
  const supabase = createClient();
  const can = permissionsFor(role);
  const [lead, setLead] = useState<Lead>(initialLead);
  const [timeline, setTimeline] = useState<Activity[]>(activities);
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [saving, setSaving] = useState(false);
  const [savingReg, setSavingReg] = useState<string | null>(null);
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

  function profileName(id?: string | null) {
    if (!id) return "غير موزع";
    const profile = profiles.find((item) => item.id === id);
    return profile?.full_name ?? profile?.email ?? "غير معروف";
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

    if (can.fullControl) payload.customer_code = form.customer_code.trim() || null;
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
    if (can.canEditSales) {
      payload.status = form.status;
      payload.customer_status = form.status;
      payload.priority = form.priority;
      payload.next_follow_up_at = form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null;
      payload.last_note = form.last_note.trim() || null;
      payload.status_updated_at = new Date().toISOString();
    }
    if (can.canAssign) {
      payload.owner_id = form.owner_id || null;
      payload.assigned_at = form.owner_id && form.owner_id !== lead.owner_id ? new Date().toISOString() : (lead as any).assigned_at ?? null;
    }
    if (can.fullControl || can.canEditFinance) {
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
      setError(error?.message ?? "تعذر حفظ بيانات العميل.");
      return;
    }

    setLead(data as Lead);
    setMessage("تم حفظ بيانات العميل بنجاح.");
    await addActivity("customer_updated", null, null, "تحديث بيانات العميل من صفحة العميل");
  }

  function updateRegistrationField(id: string, field: keyof Registration, value: string) {
    setRegistrations((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: value } as Registration;
      if (field === "list_price" || field === "discount_amount") next.final_price = Math.max(0, Number(next.list_price ?? 0) - Number(next.discount_amount ?? 0));
      return next;
    }));
  }

  async function saveRegistration(registration: Registration) {
    if (!can.fullControl && !can.canEditFinance) return;
    setSavingReg(registration.id);
    setMessage("");
    setError("");

    const payload: Record<string, string | number | null> = {
      status: registration.status,
      payment_status: registration.payment_status,
      list_price: Number(registration.list_price ?? 0),
      discount_amount: Number(registration.discount_amount ?? 0),
      final_price: Number(registration.final_price ?? 0),
      discount_code: registration.discount_code ?? null,
      paid_amount: Number(registration.paid_amount ?? 0),
      notes: registration.notes ?? null,
    };

    const { data, error } = await supabase
      .from("registrations")
      .update(payload)
      .eq("id", registration.id)
      .select("id,lead_id,company_id,course_id,sales_id,status,payment_status,list_price,discount_amount,final_price,discount_code,paid_amount,notes,created_at")
      .single();

    setSavingReg(null);
    if (error || !data) {
      setError(error?.message ?? "تعذر حفظ التسجيل.");
      return;
    }
    setRegistrations((current) => current.map((item) => (item.id === registration.id ? (data as Registration) : item)));
    setMessage("تم تحديث التسجيل بنجاح.");
    await addActivity("registration_updated", null, registration.payment_status ?? null, "تحديث بيانات التسجيل أو الدفع");
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/customers" className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">رجوع للعملاء</Link>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
          صلاحيتك الحالية: {label(role)} {can.fullControl ? "— تحكم كامل" : ""}
        </div>
      </div>

      {(message || error) ? <div className={(error ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100") + " rounded-2xl border px-4 py-3 text-sm"}>{error || message}</div> : null}

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">صفحة العميل الكاملة</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">{lead.full_name ?? "بدون اسم"}</h1>
            <p className="mt-2 text-sm text-slate-400">كود العميل: <span className="font-bold text-emerald-300">{lead.customer_code ?? lead.id}</span></p>
          </div>
          <Link href={`/registrations?leadId=${lead.id}`} className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300">تسجيل في دورة</Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="الحالة" value={label(lead.customer_status ?? lead.status)} />
          <Stat label="المسؤول" value={profileName(lead.owner_id)} />
          <Stat label="إجمالي التسجيلات" value={money(totals.total)} />
          <Stat label="المتبقي" value={money(totals.remaining)} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-2xl font-black text-white">بيانات العميل</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="كود العميل" value={form.customer_code} onChange={(value) => setField("customer_code", value)} disabled={!can.fullControl} dir="ltr" />
            <Field label="اسم العميل" value={form.full_name} onChange={(value) => setField("full_name", value)} disabled={!can.canEditBasic} />
            <Field label="البريد الإلكتروني" value={form.email} onChange={(value) => setField("email", value)} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="كود الدولة" value={form.country_code} onChange={(value) => setField("country_code", value)} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="رقم الجوال" value={form.phone_number} onChange={(value) => setField("phone_number", value.replace(/\D/g, ""))} disabled={!can.canEditBasic} dir="ltr" />
            <Field label="المصدر / الحملة" value={form.source} onChange={(value) => setField("source", value)} disabled={!can.canEditMarketing} />
            <Select label="نوع العميل" value={form.lead_type} onChange={(value) => setField("lead_type", value)} disabled={!can.canEditMarketing} options={leadTypeOptions.map((value) => ({ value, label: label(value) }))} />
            <Field label="مركز التدريب المبدئي" value={form.company_name} onChange={(value) => setField("company_name", value)} disabled={!can.canEditMarketing} />
            <Field label="الدورة المبدئية" value={form.program} onChange={(value) => setField("program", value)} disabled={!can.canEditMarketing} />
            <Select label="اختيار دورة من النظام" value={form.course_id} onChange={(value) => setField("course_id", value)} disabled={!can.canEditMarketing} options={[{ value: "", label: "بدون دورة" }, ...courses.map((course) => ({ value: course.id, label: course.name_ar ?? course.name ?? course.name_en ?? course.id }))]} />
            <Select label="حالة العميل" value={form.status} onChange={(value) => setField("status", value)} disabled={!can.canEditSales} options={statusOptions.map((value) => ({ value, label: label(value) }))} />
            <Field label="موعد المتابعة" type="datetime-local" value={form.next_follow_up_at} onChange={(value) => setField("next_follow_up_at", value)} disabled={!can.canEditSales} />
            <Select label="المسؤول عن العميل" value={form.owner_id} onChange={(value) => setField("owner_id", value)} disabled={!can.canAssign} options={[{ value: "", label: "غير موزع" }, ...profiles.filter((profile) => ["sales", "manager", "moderator", "admin"].includes(profile.role ?? "")).map((profile) => ({ value: profile.id, label: profile.full_name ?? profile.email ?? profile.id }))]} />
          </div>

          <div className="mt-3"><Textarea label="آخر ملاحظة" value={form.last_note} onChange={(value) => setField("last_note", value)} disabled={!can.canEditSales} /></div>

          {(can.fullControl || can.canEditFinance) ? (
            <div className="mt-5 rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="mb-3 font-black text-amber-100">حقول محمية للإدارة والمالية</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Select label="حالة التسجيل" value={form.registration_status} onChange={(value) => setField("registration_status", value)} options={registrationStatusOptions.map((value) => ({ value, label: label(value) }))} />
                <Select label="حالة الدفع" value={form.payment_status} onChange={(value) => setField("payment_status", value)} options={paymentStatusOptions.map((value) => ({ value, label: label(value) }))} />
                <Field label="السعر" value={form.registration_amount} onChange={(value) => setField("registration_amount", value)} dir="ltr" />
                <Field label="الخصم" value={form.discount_amount} onChange={(value) => setField("discount_amount", value)} dir="ltr" />
                <Field label="الصافي" value={form.final_amount} onChange={(value) => setField("final_amount", value)} dir="ltr" />
                <Field label="المدفوع" value={form.paid_amount} onChange={(value) => setField("paid_amount", value)} dir="ltr" />
                <Field label="كود الخصم" value={form.discount_code} onChange={(value) => setField("discount_code", value)} dir="ltr" />
              </div>
            </div>
          ) : null}

          <button onClick={saveCustomer} disabled={saving} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50" type="button">
            {saving ? "جار الحفظ..." : "حفظ بيانات العميل"}
          </button>
        </div>

        <aside className="space-y-4">
          <InfoCard title="ملخص العميل" rows={[
            ["كود العميل", lead.customer_code ?? lead.id],
            ["الجوال", lead.phone ?? "-"],
            ["المصدر", lead.source ?? "-"],
            ["الدورة", lead.program ?? courseName(lead.course_id)],
            ["آخر تواصل", formatDate(lead.last_contact_at)],
            ["موعد المتابعة", formatDate(lead.next_follow_up_at)],
          ]} />
        </aside>
      </section>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-white">التسجيلات والمدفوعات</h2>
          <Link href={`/registrations?leadId=${lead.id}`} className="rounded-2xl border border-emerald-400/30 px-4 py-2 text-sm font-bold text-emerald-200 hover:bg-emerald-400/10">إضافة تسجيل</Link>
        </div>
        <div className="space-y-3">
          {registrations.length ? registrations.map((registration) => (
            <div key={registration.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Stat label="مركز التدريب" value={centerName(registration.company_id)} />
                <Stat label="الدورة" value={courseName(registration.course_id)} />
                <Stat label="السيلز" value={profileName(registration.sales_id)} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Select label="حالة التسجيل" value={registration.status ?? "registered"} onChange={(value) => updateRegistrationField(registration.id, "status", value)} disabled={!can.fullControl && !can.canEditFinance} options={registrationStatusOptions.map((value) => ({ value, label: label(value) }))} />
                <Select label="حالة الدفع" value={registration.payment_status ?? "unpaid"} onChange={(value) => updateRegistrationField(registration.id, "payment_status", value)} disabled={!can.fullControl && !can.canEditFinance} options={paymentStatusOptions.map((value) => ({ value, label: label(value) }))} />
                <Field label="الصافي" value={String(registration.final_price ?? 0)} onChange={(value) => updateRegistrationField(registration.id, "final_price", value)} disabled={!can.fullControl && !can.canEditFinance} dir="ltr" />
                <Field label="المدفوع" value={String(registration.paid_amount ?? 0)} onChange={(value) => updateRegistrationField(registration.id, "paid_amount", value)} disabled={!can.fullControl && !can.canEditFinance} dir="ltr" />
              </div>
              {(can.fullControl || can.canEditFinance) ? <button onClick={() => saveRegistration(registration)} disabled={savingReg === registration.id} className="mt-3 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950" type="button">{savingReg === registration.id ? "جار الحفظ..." : "حفظ التسجيل"}</button> : null}
            </div>
          )) : <div className="rounded-2xl border border-white/10 p-6 text-center text-slate-400">لا توجد تسجيلات لهذا العميل حتى الآن.</div>}
        </div>
      </section>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <h2 className="mb-4 text-2xl font-black text-white">سجل النشاط</h2>
        <div className="space-y-3">
          {timeline.length ? timeline.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <div className="flex flex-wrap justify-between gap-2">
                <b className="text-white">{label(item.action)}</b>
                <span className="text-slate-500">{formatDate(item.created_at)}</span>
              </div>
              <p className="mt-2">{item.note ?? `${item.old_value ?? "-"} → ${item.new_value ?? "-"}`}</p>
              <p className="mt-1 text-xs text-slate-500">بواسطة: {item.actor_name ?? "النظام"}</p>
            </div>
          )) : <div className="rounded-2xl border border-white/10 p-6 text-center text-slate-400">لا يوجد نشاط مسجل بعد.</div>}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-black text-white">{value}</p></div>;
}

function Field({ label, value, onChange, disabled, type = "text", dir }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; type?: string; dir?: "rtl" | "ltr" }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} dir={dir ?? "rtl"} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50" /></label>;
}

function Textarea({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50" /></label>;
}

function Select({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function InfoCard({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"><h3 className="mb-4 text-xl font-black text-white">{title}</h3><div className="space-y-3">{rows.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-bold text-white">{value}</p></div>)}</div></div>;
}