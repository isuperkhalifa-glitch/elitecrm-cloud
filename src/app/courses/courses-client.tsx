"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Edit3, Loader2, Plus, Search, Tag } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";

type Course = {
  id: string;
  code: string | null;
  name: string;
  name_ar: string | null;
  name_en: string | null;
  category: string | null;
  delivery_mode: string | null;
  duration_days: number | null;
  duration_hours: number | null;
  accreditation_number: string | null;
  provider: string | null;
  base_price: number | null;
  sale_price: number | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_code: string | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
  notes: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type Props = { initialCourses: Course[]; userEmail: string | null; fullName: string | null; role: string | null };

const emptyForm = {
  id: "", code: "", name: "", name_ar: "", name_en: "", category: "", delivery_mode: "online", duration_days: "", duration_hours: "", accreditation_number: "", provider: "", base_price: "", sale_price: "", discount_type: "none", discount_value: "", discount_code: "", currency: "SAR", start_date: "", end_date: "", location: "", description: "", notes: "", is_active: true, sort_order: "0",
};

function money(value: number | string | null | undefined, currency = "SAR") {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + currency : "-";
}

function courseToForm(course: Course) {
  return { id: course.id ?? "", code: course.code ?? "", name: course.name ?? "", name_ar: course.name_ar ?? "", name_en: course.name_en ?? "", category: course.category ?? "", delivery_mode: course.delivery_mode ?? "online", duration_days: String(course.duration_days ?? ""), duration_hours: String(course.duration_hours ?? ""), accreditation_number: course.accreditation_number ?? "", provider: course.provider ?? "", base_price: String(course.base_price ?? ""), sale_price: String(course.sale_price ?? ""), discount_type: course.discount_type ?? "none", discount_value: String(course.discount_value ?? ""), discount_code: course.discount_code ?? "", currency: course.currency ?? "SAR", start_date: course.start_date ?? "", end_date: course.end_date ?? "", location: course.location ?? "", description: course.description ?? "", notes: course.notes ?? "", is_active: course.is_active ?? true, sort_order: String(course.sort_order ?? 0) };
}

export function CoursesClient({ initialCourses, userEmail, fullName, role }: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const [courses, setCourses] = useState(initialCourses);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) { return isArabic ? ar : en; }
  function setField(key: keyof typeof emptyForm, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return courses;
    return courses.filter((course) => [course.name, course.name_ar, course.name_en, course.code, course.category, course.accreditation_number, course.discount_code].filter(Boolean).join(" ").toLowerCase().includes(keyword));
  }, [courses, search]);

  const stats = useMemo(() => {
    const active = courses.filter((course) => course.is_active).length;
    const discounted = courses.filter((course) => Number(course.sale_price ?? 0) > 0 || Number(course.discount_value ?? 0) > 0).length;
    return { total: courses.length, active, discounted };
  }, [courses]);

  function startEdit(course: Course) { setEditingId(course.id); setForm(courseToForm(course)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function resetForm() { setEditingId(null); setForm(emptyForm); }

  async function saveCourse() {
    setSaving(true); setMessage(""); setError("");
    const response = await fetch("/api/admin/courses", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok || !result.course) { setError(result.error ?? tx("تعذر حفظ الدورة.", "Unable to save course.")); return; }
    const saved = result.course as Course;
    setCourses((current) => current.some((course) => course.id === saved.id) ? current.map((course) => course.id === saved.id ? saved : course) : [saved, ...current]);
    setMessage(tx("تم حفظ الدورة بنجاح.", "Course saved successfully."));
    resetForm();
  }

  async function toggleCourse(course: Course) {
    const response = await fetch("/api/admin/courses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...course, is_active: !course.is_active }) });
    const result = await response.json();
    if (response.ok && result.course) setCourses((current) => current.map((item) => item.id === course.id ? (result.course as Course) : item));
  }

  return (
    <AppShell titleKey="courses" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">{tx("كتالوج الدورات والأسعار والخصومات", "Courses catalog, prices, and discounts")}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{tx("الدورات", "Courses")}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{tx("سجل كل دورة بتفاصيلها والسعر والخصم وكود الخصم والاعتماد والمدة.", "Add every course with full details, prices, discounts, promo codes, accreditation, and duration.")}</p>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3"><Stat label={tx("كل الدورات", "All courses")} value={stats.total} /><Stat label={tx("الدورات النشطة", "Active courses")} value={stats.active} /><Stat label={tx("عليها خصم", "Discounted")} value={stats.discounted} /></div>
      <section className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><BookOpen className="h-6 w-6" /></div><div><p className="text-sm text-emerald-300">{editingId ? tx("تعديل دورة", "Edit course") : tx("إضافة دورة", "Add course")}</p><h2 className="text-2xl font-black text-white">{editingId ? form.name : tx("دورة جديدة", "New course")}</h2></div></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input value={form.name} onChange={(value) => setField("name", value)} label={tx("اسم الدورة", "Course name")} />
          <Input value={form.code} onChange={(value) => setField("code", value)} label={tx("كود الدورة", "Course code")} dir="ltr" />
          <Input value={form.name_ar} onChange={(value) => setField("name_ar", value)} label={tx("الاسم العربي", "Arabic name")} />
          <Input value={form.name_en} onChange={(value) => setField("name_en", value)} label={tx("الاسم الإنجليزي", "English name")} dir="ltr" />
          <Input value={form.category} onChange={(value) => setField("category", value)} label={tx("التصنيف", "Category")} />
          <Select value={form.delivery_mode} onChange={(value) => setField("delivery_mode", value)} label={tx("نوع الحضور", "Delivery")} options={["online", "offline", "hybrid"]} />
          <Input value={form.duration_days} onChange={(value) => setField("duration_days", value)} label={tx("عدد الأيام", "Days")} type="number" />
          <Input value={form.duration_hours} onChange={(value) => setField("duration_hours", value)} label={tx("عدد الساعات", "Hours")} type="number" />
          <Input value={form.accreditation_number} onChange={(value) => setField("accreditation_number", value)} label={tx("رقم الاعتماد", "Accreditation No.")} />
          <Input value={form.provider} onChange={(value) => setField("provider", value)} label={tx("الجهة", "Provider")} />
          <Input value={form.base_price} onChange={(value) => setField("base_price", value)} label={tx("السعر الأساسي", "Base price")} type="number" />
          <Input value={form.sale_price} onChange={(value) => setField("sale_price", value)} label={tx("سعر العرض", "Sale price")} type="number" />
          <Select value={form.discount_type} onChange={(value) => setField("discount_type", value)} label={tx("نوع الخصم", "Discount type")} options={["none", "fixed", "percentage"]} />
          <Input value={form.discount_value} onChange={(value) => setField("discount_value", value)} label={tx("قيمة الخصم", "Discount value")} type="number" />
          <Input value={form.discount_code} onChange={(value) => setField("discount_code", value)} label={tx("كود الخصم", "Discount code")} dir="ltr" />
          <Input value={form.currency} onChange={(value) => setField("currency", value)} label={tx("العملة", "Currency")} dir="ltr" />
          <Input value={form.start_date} onChange={(value) => setField("start_date", value)} label={tx("تاريخ البداية", "Start date")} type="date" />
          <Input value={form.end_date} onChange={(value) => setField("end_date", value)} label={tx("تاريخ النهاية", "End date")} type="date" />
          <Input value={form.location} onChange={(value) => setField("location", value)} label={tx("الموقع", "Location")} />
          <Input value={form.sort_order} onChange={(value) => setField("sort_order", value)} label={tx("الترتيب", "Sort order")} type="number" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2"><Textarea value={form.description} onChange={(value) => setField("description", value)} label={tx("وصف الدورة", "Description")} /><Textarea value={form.notes} onChange={(value) => setField("notes", value)} label={tx("ملاحظات داخلية", "Internal notes")} /></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="inline-flex items-center gap-2 text-sm font-bold text-slate-300"><input type="checkbox" checked={form.is_active} onChange={(event) => setField("is_active", event.target.checked)} className="h-4 w-4 accent-emerald-400" />{tx("الدورة نشطة", "Course is active")}</label><div className="flex gap-2">{editingId ? <button type="button" onClick={resetForm} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10">{tx("إلغاء", "Cancel")}</button> : null}<button type="button" onClick={saveCourse} disabled={saving || !form.name.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingId ? tx("حفظ التعديل", "Save changes") : tx("إضافة الدورة", "Add course")}</button></div></div>
        {message ? <p className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" />{message}</p> : null}{error ? <p className="mt-4 text-sm font-bold text-red-300">{error}</p> : null}
      </section>
      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="text-2xl font-black text-white">{tx("قائمة الدورات", "Course list")}</h2><div className="relative md:w-96"><Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tx("ابحث في الدورات...", "Search courses...")} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-11 py-3 text-sm text-white outline-none focus:border-emerald-400" /></div></div><div className="grid gap-4 xl:grid-cols-2">{filteredCourses.map((course) => (<article key={course.id} className="rounded-[2rem] border border-white/10 bg-slate-950/50 p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs text-emerald-300" dir="ltr">{course.code ?? course.id}</p><h3 className="mt-1 text-xl font-black text-white">{isArabic ? course.name_ar ?? course.name : course.name_en ?? course.name}</h3><p className="mt-1 text-sm text-slate-400">{course.category ?? "-"} آ· {course.delivery_mode ?? "-"}</p></div><span className={(course.is_active ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300") + " rounded-full px-3 py-1 text-xs font-bold"}>{course.is_active ? tx("نشطة", "Active") : tx("متوقفة", "Inactive")}</span></div><div className="grid gap-3 md:grid-cols-3"><Info label={tx("السعر", "Price")} value={money(course.base_price, course.currency ?? "SAR")} /><Info label={tx("العرض", "Offer")} value={course.sale_price ? money(course.sale_price, course.currency ?? "SAR") : "-"} /><Info label={tx("كود الخصم", "Code")} value={course.discount_code ?? "-"} /></div><div className="mt-4 grid gap-3 md:grid-cols-3"><Info label={tx("الاعتماد", "Accreditation")} value={course.accreditation_number ?? "-"} /><Info label={tx("المدة", "Duration")} value={(course.duration_days ?? "-") + " " + tx("يوم", "days") + " / " + (course.duration_hours ?? "-") + " " + tx("ساعة", "hours")} /><Info label={tx("الموقع", "Location")} value={course.location ?? "-"} /></div>{course.description ? <p className="mt-4 rounded-2xl bg-white/[0.03] p-3 text-sm leading-7 text-slate-300">{course.description}</p> : null}<div className="mt-4 flex gap-2"><button type="button" onClick={() => startEdit(course)} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"><Edit3 className="h-4 w-4" />{tx("تعديل", "Edit")}</button><button type="button" onClick={() => toggleCourse(course)} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"><Tag className="h-4 w-4" />{course.is_active ? tx("إيقاف", "Disable") : tx("تشغيل", "Enable")}</button></div></article>))}</div>{filteredCourses.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">{tx("لا توجد دورات.", "No courses found.")}</div> : null}</section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-slate-400">{label}</p><h2 className="mt-2 text-3xl font-black text-white">{value}</h2></div>; }
function Input({ label, value, onChange, type = "text", dir }: { label: string; value: string; onChange: (value: string) => void; type?: string; dir?: "rtl" | "ltr" }) { return <label><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} type={type} dir={dir} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" /></label>; }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">{options.map((option) => <option value={option} key={option}>{option}</option>)}</select></label>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white/[0.03] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>; }
