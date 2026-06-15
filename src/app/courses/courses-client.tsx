"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Pencil, Plus, Search, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

type TrainingCenter = {
  id: string;
  name: string;
  status: string | null;
  commission_type: string | null;
  commission_value: number | null;
};

type Course = {
  id: string;
  name: string | null;
  name_ar: string | null;
  name_en: string | null;
  company_id: string | null;
  code: string | null;
  accreditation_number: string | null;
  delivery_mode: string | null;
  duration_days: number | null;
  duration_hours: number | null;
  price: number | null;
  sale_price: number | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_code: string | null;
  location: string | null;
  notes: string | null;
  status: string | null;
  sort_order: number | null;
  created_at: string | null;
};

type Props = {
  initialCourses: Course[];
  trainingCenters: TrainingCenter[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type CourseForm = {
  company_id: string;
  name_ar: string;
  name_en: string;
  code: string;
  accreditation_number: string;
  delivery_mode: string;
  duration_days: string;
  duration_hours: string;
  price: string;
  sale_price: string;
  discount_type: string;
  discount_value: string;
  discount_code: string;
  location: string;
  notes: string;
  status: string;
};

const emptyForm: CourseForm = {
  company_id: "",
  name_ar: "",
  name_en: "",
  code: "",
  accreditation_number: "",
  delivery_mode: "online",
  duration_days: "5",
  duration_hours: "25",
  price: "0",
  sale_price: "",
  discount_type: "none",
  discount_value: "0",
  discount_code: "",
  location: "",
  notes: "",
  status: "active",
};

function makeId(form: CourseForm) {
  const base = (form.code || form.name_en || form.name_ar || "course")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9؀-ۿ]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return base || "course-" + Date.now();
}

function numberValue(value: string) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function netPrice(course: Pick<Course, "price" | "sale_price" | "discount_type" | "discount_value">) {
  const price = Number(course.price ?? 0);
  if (course.sale_price !== null && course.sale_price !== undefined && Number(course.sale_price) > 0) return Number(course.sale_price);
  const discount = Number(course.discount_value ?? 0);
  if (course.discount_type === "percentage") return Math.max(0, price - price * (discount / 100));
  if (course.discount_type === "fixed") return Math.max(0, price - discount);
  return price;
}

export function CoursesClient({ initialCourses, trainingCenters, userEmail, fullName, role }: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function centerName(id: string | null) {
    if (!id) return tx("ط؛ظٹط± ظ…ط­ط¯ط¯", "Not selected");
    return trainingCenters.find((center) => center.id === id)?.name ?? id;
  }

  function updateField(field: keyof CourseForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      company_id: course.company_id ?? "",
      name_ar: course.name_ar ?? course.name ?? "",
      name_en: course.name_en ?? "",
      code: course.code ?? course.id ?? "",
      accreditation_number: course.accreditation_number ?? "",
      delivery_mode: course.delivery_mode ?? "online",
      duration_days: String(course.duration_days ?? ""),
      duration_hours: String(course.duration_hours ?? ""),
      price: String(course.price ?? 0),
      sale_price: course.sale_price ? String(course.sale_price) : "",
      discount_type: course.discount_type ?? "none",
      discount_value: String(course.discount_value ?? 0),
      discount_code: course.discount_code ?? "",
      location: course.location ?? "",
      notes: course.notes ?? "",
      status: course.status ?? "active",
    });
    setMessage("");
    setError("");
  }

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesCenter = centerFilter === "all" || course.company_id === centerFilter;
      const matchesSearch =
        !keyword ||
        [course.name_ar, course.name_en, course.code, course.accreditation_number, centerName(course.company_id)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      return matchesCenter && matchesSearch;
    });
  }, [courses, search, centerFilter, trainingCenters]);

  async function saveCourse() {
    setMessage("");
    setError("");

    if (!form.company_id) {
      setError(tx("ط§ط®طھظٹط§ط± ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨ ظ…ط·ظ„ظˆط¨.", "Training center is required."));
      return;
    }

    if (!form.name_ar.trim() && !form.name_en.trim()) {
      setError(tx("ط§ط³ظ… ط§ظ„ط¯ظˆط±ط© ظ…ط·ظ„ظˆط¨.", "Course name is required."));
      return;
    }

    setSaving(true);

    const payload = {
      id: editingId ?? makeId(form),
      name: form.name_ar.trim() || form.name_en.trim(),
      name_ar: form.name_ar.trim() || null,
      name_en: form.name_en.trim() || null,
      company_id: form.company_id,
      code: form.code.trim() || null,
      accreditation_number: form.accreditation_number.trim() || null,
      delivery_mode: form.delivery_mode,
      duration_days: form.duration_days ? numberValue(form.duration_days) : null,
      duration_hours: form.duration_hours ? numberValue(form.duration_hours) : null,
      price: numberValue(form.price),
      sale_price: form.sale_price ? numberValue(form.sale_price) : null,
      discount_type: form.discount_type,
      discount_value: numberValue(form.discount_value),
      discount_code: form.discount_code.trim() || null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
      is_active: form.status === "active",
    };

    const supabase = createClient();
    const query = editingId
      ? supabase.from("courses").update(payload).eq("id", editingId)
      : supabase.from("courses").upsert(payload, { onConflict: "id" });

    const { data, error } = await query
      .select("id,name,name_ar,name_en,company_id,code,accreditation_number,delivery_mode,duration_days,duration_hours,price,sale_price,discount_type,discount_value,discount_code,location,notes,status,sort_order,created_at")
      .single();

    setSaving(false);

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? tx("طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¯ظˆط±ط©.", "Unable to save course."));
      return;
    }

    const saved = data as Course;
    setCourses((current) => {
      const exists = current.some((course) => course.id === saved.id);
      return exists ? current.map((course) => (course.id === saved.id ? saved : course)) : [saved, ...current];
    });
    setMessage(tx("طھظ… ط­ظپط¸ ط§ظ„ط¯ظˆط±ط© ط¨ظ†ط¬ط§ط­.", "Course saved successfully."));
    resetForm();
  }

  return (
    <AppShell titleKey="courses" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="mb-6 safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-emerald-300">{tx("ط¥ط¯ط§ط±ط© ط¯ظˆط±ط§طھ ظƒظ„ ظ…ط±ظƒط² طھط¯ط±ظٹط¨ ظ…ظ† ظ…ظƒط§ظ† ظˆط§ط­ط¯.", "Manage every training center course from one place.")}</p>
        <h1 className="mt-2 text-3xl font-black text-white">{tx("ط§ظ„ط¯ظˆط±ط§طھ", "Courses")}</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-300">{editingId ? tx("طھط¹ط¯ظٹظ„ ط¯ظˆط±ط©", "Edit course") : tx("ط¥ط¶ط§ظپط© ط¯ظˆط±ط©", "Add course")}</p>
              <h2 className="text-2xl font-black text-white">{tx("طھظپط§طµظٹظ„ ط§ظ„ط¯ظˆط±ط©", "Course details")}</h2>
            </div>
          </div>

          <div className="space-y-3">
            <select value={form.company_id} onChange={(event) => updateField("company_id", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
              <option value="">{tx("ط§ط®طھط± ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨", "Choose training center")}</option>
              {trainingCenters.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
            </select>

            <input value={form.name_ar} onChange={(event) => updateField("name_ar", event.target.value)} placeholder={tx("ط§ط³ظ… ط§ظ„ط¯ظˆط±ط© ط¨ط§ظ„ط¹ط±ط¨ظٹ", "Arabic course name")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            <input value={form.name_en} onChange={(event) => updateField("name_en", event.target.value)} placeholder={tx("ط§ط³ظ… ط§ظ„ط¯ظˆط±ط© ط¨ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ", "English course name")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />

            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.code} onChange={(event) => updateField("code", event.target.value)} placeholder={tx("ظƒظˆط¯ ط§ظ„ط¯ظˆط±ط©", "Course code")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={form.accreditation_number} onChange={(event) => updateField("accreditation_number", event.target.value)} placeholder={tx("ط±ظ‚ظ… ط§ظ„ط§ط¹طھظ…ط§ط¯", "Accreditation no.")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select value={form.delivery_mode} onChange={(event) => updateField("delivery_mode", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
                <option value="online">{tx("ط£ظˆظ†ظ„ط§ظٹظ†", "Online")}</option>
                <option value="offline">{tx("ط­ط¶ظˆط±ظٹ", "Offline")}</option>
                <option value="hybrid">{tx("ظ‡ط¬ظٹظ†", "Hybrid")}</option>
              </select>
              <input value={form.duration_days} onChange={(event) => updateField("duration_days", event.target.value)} type="number" placeholder={tx("ط§ظ„ط£ظٹط§ظ…", "Days")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={form.duration_hours} onChange={(event) => updateField("duration_hours", event.target.value)} type="number" placeholder={tx("ط§ظ„ط³ط§ط¹ط§طھ", "Hours")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.price} onChange={(event) => updateField("price", event.target.value)} type="number" placeholder={tx("ط§ظ„ط³ط¹ط± ط§ظ„ط£ط³ط§ط³ظٹ", "Base price")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={form.sale_price} onChange={(event) => updateField("sale_price", event.target.value)} type="number" placeholder={tx("ط³ط¹ط± ط§ظ„ط¹ط±ط¶", "Offer price")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select value={form.discount_type} onChange={(event) => updateField("discount_type", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
                <option value="none">{tx("ط¨ط¯ظˆظ† ط®طµظ…", "No discount")}</option>
                <option value="percentage">{tx("ظ†ط³ط¨ط©", "Percentage")}</option>
                <option value="fixed">{tx("ظ…ط¨ظ„ط؛ ط«ط§ط¨طھ", "Fixed")}</option>
              </select>
              <input value={form.discount_value} onChange={(event) => updateField("discount_value", event.target.value)} type="number" placeholder={tx("ظ‚ظٹظ…ط© ط§ظ„ط®طµظ…", "Discount value")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
              <input value={form.discount_code} onChange={(event) => updateField("discount_code", event.target.value)} placeholder={tx("ظƒظˆط¯ ط§ظ„ط®طµظ…", "Discount code")} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            </div>

            <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder={tx("ط§ظ„ظ…ظƒط§ظ†", "Location")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />
            <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder={tx("ظ…ظ„ط§ط­ط¸ط§طھ", "Notes")} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400" />

            <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
              <option value="active">{tx("ظ†ط´ط·ط©", "Active")}</option>
              <option value="paused">{tx("ظ…طھظˆظ‚ظپط©", "Paused")}</option>
              <option value="archived">{tx("ظ…ط¤ط±ط´ظپط©", "Archived")}</option>
            </select>

            {error ? <div className="flex gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><XCircle className="h-4 w-4" />{error}</div> : null}
            {message ? <div className="flex gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{message}</div> : null}

            <div className="flex gap-3">
              <button onClick={saveCourse} disabled={saving} type="button" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60">
                <Plus className="h-5 w-5" />
                {saving ? tx("ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸...", "Saving...") : editingId ? tx("ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„", "Save changes") : tx("ط¥ط¶ط§ظپط© ط§ظ„ط¯ظˆط±ط©", "Add course")}
              </button>
              {editingId ? <button onClick={resetForm} type="button" className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">{tx("ط¥ظ„ط؛ط§ط،", "Cancel")}</button> : null}
            </div>
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tx("ط§ط¨ط­ط« ط¹ظ† ط¯ظˆط±ط©...", "Search courses...")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-11 py-3 text-white outline-none focus:border-emerald-400" />
            </div>
            <select value={centerFilter} onChange={(event) => setCenterFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400">
              <option value="all">{tx("ظƒظ„ ظ…ط±ط§ظƒط² ط§ظ„طھط¯ط±ظٹط¨", "All training centers")}</option>
              {trainingCenters.map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
            </select>
          </div>

          <div className="grid gap-3">
            {filteredCourses.map((course) => (
              <article key={course.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs text-emerald-300">{centerName(course.company_id)}</p>
                    <h2 className="mt-1 text-xl font-black text-white">{isArabic ? course.name_ar ?? course.name : course.name_en ?? course.name_ar ?? course.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{course.code ?? "-"} {course.accreditation_number ? "â€” " + tx("ط§ط¹طھظ…ط§ط¯", "Accreditation") + " " + course.accreditation_number : ""}</p>
                    <p className="mt-2 text-sm text-slate-300">{course.delivery_mode ?? "-"} آ· {course.duration_days ?? "-"} {tx("ط£ظٹط§ظ…", "days")} آ· {course.duration_hours ?? "-"} {tx("ط³ط§ط¹ط©", "hours")}</p>
                  </div>
                  <div className="min-w-44 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                    <p className="text-slate-400">{tx("ط§ظ„ط³ط¹ط± ط§ظ„ط£ط³ط§ط³ظٹ", "Base price")}: <span className="text-white">{course.price ?? 0}</span></p>
                    <p className="text-slate-400">{tx("ط§ظ„طµط§ظپظٹ", "Net")}: <span className="font-black text-emerald-300">{netPrice(course).toFixed(2)}</span></p>
                    {course.discount_code ? <p className="text-slate-400">{tx("ط§ظ„ظƒظˆط¯", "Code")}: <span className="text-sky-300">{course.discount_code}</span></p> : null}
                    <button onClick={() => startEdit(course)} type="button" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10">
                      <Pencil className="h-4 w-4" /> {tx("طھط¹ط¯ظٹظ„", "Edit")}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {filteredCourses.length === 0 ? <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">{tx("ظ„ط§ طھظˆط¬ط¯ ط¯ظˆط±ط§طھ ط¨ط¹ط¯.", "No courses yet.")}</div> : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
