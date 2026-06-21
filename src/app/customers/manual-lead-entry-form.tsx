"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlusCircle, UserPlus, XCircle } from "lucide-react";
import { NativeDateInput } from "@/components/native-date-input";
import { countryCodes } from "@/lib/crm/customer-core";
import { useI18n } from "@/components/language-provider";

type CompanyOption = { id: string; name: string };
type CourseOption = { id: string; name: string; company_id?: string | null };
type ProfileOption = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

type Props = {
  companies: CompanyOption[];
  courses: CourseOption[];
  profiles: ProfileOption[];
  currentUserId: string;
  role: string | null;
  scopedCompanyId?: string | null;
  scopedUserId?: string | null;
};

type FormState = {
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  companyId: string;
  courseId: string;
  source: string;
  campaignName: string;
  ownerId: string;
  status: string;
  nextFollowUpAt: string;
  notes: string;
};

const createRoles = new Set(["developer", "admin", "manager", "moderator", "marketer", "sales"]);

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function initialForm(role: string | null, currentUserId: string, scopedCompanyId?: string | null, scopedUserId?: string | null): FormState {
  return {
    fullName: "",
    countryCode: "+966",
    phoneNumber: "",
    email: "",
    companyId: scopedCompanyId ?? "",
    courseId: "",
    source: "manual_entry",
    campaignName: "",
    ownerId: scopedUserId ?? (role === "sales" ? currentUserId : ""),
    status: "interested",
    nextFollowUpAt: "",
    notes: "",
  };
}

export function ManualLeadEntryForm({
  companies,
  courses,
  profiles,
  currentUserId,
  role,
  scopedCompanyId,
  scopedUserId,
}: Props) {
  const router = useRouter();
  const { language } = useI18n();
  const ar = language === "ar";
  const tx = (arabic: string, english: string) => (ar ? arabic : english);
  const [form, setForm] = useState<FormState>(() => initialForm(role, currentUserId, scopedCompanyId, scopedUserId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canCreate = createRoles.has(role ?? "");
  const salesProfiles = useMemo(
    () => profiles.filter((profile) => profile.is_active !== false && ["sales", "manager"].includes(profile.role ?? "")),
    [profiles]
  );
  const visibleCourses = useMemo(
    () => courses.filter((course) => !form.companyId || !course.company_id || course.company_id === form.companyId),
    [courses, form.companyId]
  );
  const minimumFollowUp = useMemo(() => localDateTimeValue(new Date(Date.now() + 60_000)), []);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "companyId" ? { courseId: "" } : {}),
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.fullName.trim() || !form.phoneNumber.replace(/\D/g, "")) {
      setError(tx("اسم العميل ورقم الجوال مطلوبان.", "Customer name and phone number are required."));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/v1/leads/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.fullName,
          country_code: form.countryCode,
          phone_number: form.phoneNumber,
          email: form.email,
          company_id: form.companyId || null,
          course_id: form.courseId || null,
          source: form.source,
          campaign_name: form.campaignName,
          owner_id: form.ownerId || null,
          status: form.status,
          next_follow_up_at: form.nextFollowUpAt || null,
          notes: form.notes,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? tx("تعذر تسجيل العميل.", "Unable to create customer."));
        return;
      }

      setMessage(result.message ?? tx("تم تسجيل العميل بنجاح.", "Customer created successfully."));
      setForm(initialForm(role, currentUserId, scopedCompanyId, scopedUserId));
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tx("حدث خطأ غير متوقع.", "Unexpected error."));
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <section className="v8-card rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {tx("صلاحيتك تسمح بعرض العملاء اليدويين فقط، ولا تسمح بإضافة عميل جديد.", "Your role can view manual customers but cannot create a new one.")}
      </section>
    );
  }

  return (
    <section className="v8-card rounded-md p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--v8-border)" }}>
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <UserPlus className="h-5 w-5" />
            <span className="text-xs font-bold">{tx("إضافة مباشرة", "Direct entry")}</span>
          </div>
          <h2 className="v8-heading mt-1 text-xl font-semibold">{tx("تسجيل عميل يدوي جديد", "Create a manual customer")}</h2>
          <p className="v8-muted mt-1 text-sm">
            {tx("سجّل بيانات العميل وحدد الدورة والمسؤول وموعد المتابعة من نفس الصفحة.", "Enter customer details, course, owner, and follow-up time from the same page.")}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label={tx("اسم العميل *", "Customer name *")} wide>
            <input
              value={form.fullName}
              onChange={(event) => setField("fullName", event.target.value)}
              required
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              placeholder={tx("الاسم الكامل", "Full name")}
            />
          </Field>

          <Field label={tx("رقم الجوال *", "Phone number *")} wide>
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2" dir="ltr">
              <select
                value={form.countryCode}
                onChange={(event) => setField("countryCode", event.target.value)}
                className="v8-input rounded border px-2 py-2.5 text-sm"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>{country.code}</option>
                ))}
              </select>
              <input
                value={form.phoneNumber}
                onChange={(event) => setField("phoneNumber", event.target.value.replace(/[^\d\s-]/g, ""))}
                required
                inputMode="numeric"
                className="v8-input w-full rounded border px-3 py-2.5 text-sm"
                placeholder="5xxxxxxxx"
              />
            </div>
          </Field>

          <Field label={tx("البريد الإلكتروني", "Email") }>
            <input
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              type="email"
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              placeholder="name@example.com"
            />
          </Field>

          <Field label={tx("مركز التدريب", "Training center") }>
            <select
              value={form.companyId}
              onChange={(event) => setField("companyId", event.target.value)}
              disabled={Boolean(scopedCompanyId)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm disabled:opacity-60"
            >
              <option value="">{tx("بدون مركز محدد", "No specific center")}</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </Field>

          <Field label={tx("الدورة", "Course") }>
            <select
              value={form.courseId}
              onChange={(event) => setField("courseId", event.target.value)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
            >
              <option value="">{tx("بدون دورة محددة", "No specific course")}</option>
              {visibleCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </Field>

          <Field label={tx("مصدر العميل", "Customer source") }>
            <input
              value={form.source}
              onChange={(event) => setField("source", event.target.value)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              placeholder={tx("مثال: واتساب أو إحالة", "Example: WhatsApp or referral")}
            />
          </Field>

          <Field label={tx("اسم الحملة", "Campaign name") }>
            <input
              value={form.campaignName}
              onChange={(event) => setField("campaignName", event.target.value)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              placeholder={tx("اختياري", "Optional")}
            />
          </Field>

          <Field label={tx("المسؤول", "Owner") }>
            <select
              value={form.ownerId}
              onChange={(event) => setField("ownerId", event.target.value)}
              disabled={role === "sales" || Boolean(scopedUserId)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm disabled:opacity-60"
            >
              <option value="">{tx("بدون توزيع الآن", "Leave unassigned")}</option>
              {salesProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>
              ))}
            </select>
          </Field>

          <Field label={tx("حالة العميل", "Customer status") }>
            <select
              value={form.status}
              onChange={(event) => setField("status", event.target.value)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
            >
              <option value="interested">{tx("مهتم", "Interested")}</option>
              <option value="need_offer">{tx("يحتاج عرض", "Needs offer")}</option>
              <option value="busy">{tx("مشغول", "Busy")}</option>
              <option value="missed">{tx("لم يرد", "No answer")}</option>
              <option value="not_interested">{tx("غير مهتم", "Not interested")}</option>
              <option value="wrong_number">{tx("رقم خطأ", "Wrong number")}</option>
              <option value="paid">{tx("مدفوع", "Paid")}</option>
            </select>
          </Field>

          <Field label={tx("موعد المتابعة", "Follow-up date") }>
            <NativeDateInput
              type="datetime-local"
              value={form.nextFollowUpAt}
              min={minimumFollowUp}
              onChange={(value) => setField("nextFollowUpAt", value)}
              ariaLabel={tx("فتح تقويم موعد المتابعة", "Open follow-up date picker")}
            />
          </Field>

          <Field label={tx("ملاحظات", "Notes") } wide>
            <textarea
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              rows={3}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              placeholder={tx("أي تفاصيل مهمة عن العميل", "Any important customer details")}
            />
          </Field>
        </div>

        {error ? <Notice error>{error}</Notice> : null}
        {message ? <Notice>{message}</Notice> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {saving ? tx("جاري التسجيل...", "Creating...") : tx("تسجيل العميل", "Create customer")}
          </button>
          <span className="v8-muted text-xs">
            {tx("إذا كان الرقم موجودًا، سيُنشأ سجل جديد كإعادة استهداف دون تعديل السجل القديم.", "If the phone already exists, a new retargeting record is created without changing history.")}
          </span>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "xl:col-span-2" : ""}>
      <span className="v8-heading mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div className={`flex items-start gap-2 rounded border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
      {error ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      {children}
    </div>
  );
}
