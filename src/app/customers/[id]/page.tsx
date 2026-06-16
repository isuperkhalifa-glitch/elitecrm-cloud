import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

type RegistrationRow = {
  id: string;
  lead_id: string | null;
  company_id: string | null;
  course_id: string | null;
  sales_id: string | null;
  status: string | null;
  payment_status: string | null;
  list_price: number | null;
  discount_amount: number | null;
  final_price: number | null;
  discount_code: string | null;
  paid_amount: number | null;
  notes: string | null;
  created_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value?: number | string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0";
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(amount);
}

function statusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    interested: "مهتم",
    not_interested: "غير مهتم",
    need_offer: "محتاج عرض",
    missed: "لم يرد",
    wrong_number: "رقم خطأ",
    paid: "مدفوع",
    busy: "مشغول",
    new: "جديد",
    assigned: "موزع",
    contacted: "تم التواصل",
    qualified: "مهتم",
    converted: "تم التسجيل",
    lost: "غير مهتم",
    registered: "مسجل",
    not_registered: "غير مسجل",
  };

  return value ? labels[value] ?? value : "-";
}

function paymentLabel(value?: string | null) {
  const labels: Record<string, string> = {
    unpaid: "غير مدفوع",
    partial: "دفع جزئي",
    paid: "مدفوع",
    refunded: "مسترد",
  };

  return value ? labels[value] ?? value : "غير مدفوع";
}

function registrationLabel(value?: string | null) {
  const labels: Record<string, string> = {
    registered: "مسجل",
    pending: "قيد المراجعة",
    canceled: "ملغي",
    not_registered: "غير مسجل",
  };

  return value ? labels[value] ?? value : "غير مسجل";
}

function actionLabel(value: string) {
  const labels: Record<string, string> = {
    status_changed: "تغيير الحالة",
    followup_changed: "تحديد متابعة",
    note_added: "إضافة ملاحظة",
    customer_updated: "تحديث العميل",
    transferred: "تحويل العميل",
  };

  return labels[value] ?? value;
}

function phoneDisplay(lead: any) {
  const splitPhone = `${lead.country_code ?? ""}${lead.phone_number ?? ""}`.trim();
  return splitPhone || lead.phone || "-";
}

function byId(rows: any[] | null | undefined) {
  const map = new Map<string, any>();
  for (const row of rows ?? []) {
    if (row?.id) map.set(String(row.id), row);
  }
  return map;
}

export default async function CustomerPage({ params }: Props) {
  const resolved = await params;
  const { supabase, user, profile } = await getCurrentUserProfile();

  requirePageAccess(profile?.role, "customers");

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", resolved.id)
    .single();

  if (!lead) {
    return (
      <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-100">
          العميل غير موجود.
        </div>
      </AppShell>
    );
  }

  const [{ data: activities }, { data: registrations }] = await Promise.all([
    supabase
      .from("customer_activities")
      .select("*")
      .eq("lead_id", resolved.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("registrations")
      .select("id,lead_id,company_id,course_id,sales_id,status,payment_status,list_price,discount_amount,final_price,discount_code,paid_amount,notes,created_at")
      .eq("lead_id", resolved.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const registrationRows = (registrations ?? []) as RegistrationRow[];
  const companyIds = Array.from(new Set(registrationRows.map((item) => item.company_id).filter(Boolean))) as string[];
  const courseIds = Array.from(new Set(registrationRows.map((item) => item.course_id).filter(Boolean))) as string[];
  const salesIds = Array.from(new Set([lead.owner_id, ...registrationRows.map((item) => item.sales_id)].filter(Boolean))) as string[];

  const [{ data: companies }, { data: courses }, { data: profiles }] = await Promise.all([
    companyIds.length ? supabase.from("companies").select("id,name").in("id", companyIds) : Promise.resolve({ data: [] as any[] }),
    courseIds.length ? supabase.from("courses").select("id,name,name_ar,name_en,code").in("id", courseIds) : Promise.resolve({ data: [] as any[] }),
    salesIds.length ? supabase.from("profiles").select("id,full_name,email,role").in("id", salesIds) : Promise.resolve({ data: [] as any[] }),
  ]);

  const companiesMap = byId(companies as any[]);
  const coursesMap = byId(courses as any[]);
  const profilesMap = byId(profiles as any[]);

  const totalFinal = registrationRows.reduce((sum, row) => sum + Number(row.final_price ?? 0), 0);
  const totalPaid = registrationRows.reduce((sum, row) => sum + Number(row.paid_amount ?? 0), 0);
  const remaining = Math.max(0, totalFinal - totalPaid);
  const customerStatus = lead.customer_status ?? lead.status;
  const isRegistered = registrationRows.length > 0;
  const isPaid = totalFinal > 0 && totalPaid >= totalFinal;
  const isPartial = totalPaid > 0 && !isPaid;

  const journey = [
    { title: "إضافة العميل", description: lead.source ? `المصدر: ${lead.source}` : "تم إنشاء العميل داخل النظام", done: true, date: lead.created_at },
    { title: "التوزيع", description: lead.owner_id ? `السيلز: ${profilesMap.get(lead.owner_id)?.full_name ?? profilesMap.get(lead.owner_id)?.email ?? "غير معروف"}` : "لم يتم التوزيع بعد", done: Boolean(lead.owner_id), date: lead.assigned_at },
    { title: "المتابعة", description: lead.last_note || (lead.next_follow_up_at ? "تم تحديد موعد متابعة" : "لم تبدأ المتابعة بعد"), done: Boolean(lead.last_contact_at || lead.next_follow_up_at), date: lead.last_contact_at ?? lead.next_follow_up_at },
    { title: "التسجيل", description: isRegistered ? `${registrationRows.length} تسجيل` : "لم يتم تسجيل العميل بعد", done: isRegistered, date: registrationRows[0]?.created_at },
    { title: "الدفع", description: isPaid ? "تم السداد بالكامل" : isPartial ? `متبقي ${formatMoney(remaining)}` : "لم يتم الدفع بعد", done: isPaid, date: registrationRows.find((row) => row.payment_status === "paid")?.created_at },
  ];

  return (
    <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Link href="/customers" className="inline-flex rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
            رجوع للعملاء
          </Link>
          <Link href={`/registrations?leadId=${lead.id}`} className="inline-flex rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300">
            تسجيل العميل في دورة
          </Link>
        </div>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-emerald-300">ملف العميل الكامل</p>
              <h1 className="mt-2 text-3xl font-black text-white">{lead.full_name ?? "بدون اسم"}</h1>
              <p className="mt-2 text-slate-400" dir="ltr">{phoneDisplay(lead)}</p>
              {lead.email ? <p className="mt-1 text-sm text-slate-500" dir="ltr">{lead.email}</p> : null}
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[520px]">
              <Metric label="حالة العميل" value={statusLabel(customerStatus)} />
              <Metric label="إجمالي التسجيلات" value={registrationRows.length} />
              <Metric label="المتبقي" value={formatMoney(remaining)} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Info label="الدورة المطلوبة" value={lead.program ?? lead.course_name ?? lead.course_id ?? "-"} />
            <Info label="نوع العميل" value={lead.lead_type ?? "-"} />
            <Info label="المصدر" value={lead.source ?? "-"} />
            <Info label="موعد المتابعة" value={formatDate(lead.next_follow_up_at)} />
            <Info label="حالة التسجيل" value={registrationLabel(lead.registration_status)} />
            <Info label="حالة الدفع" value={paymentLabel(lead.payment_status)} />
            <Info label="آخر ملاحظة" value={lead.last_note ?? "-"} />
            <Info label="تاريخ الإنشاء" value={formatDate(lead.created_at)} />
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">رحلة العميل</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {journey.map((step, index) => (
              <div key={step.title} className={(step.done ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/10 bg-white/[0.03]") + " rounded-3xl border p-4"}>
                <div className={(step.done ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-400") + " mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black"}>{index + 1}</div>
                <h3 className="font-black text-white">{step.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-300">{step.description}</p>
                <p className="mt-3 text-xs text-slate-500">{formatDate(step.date)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">التسجيلات والمدفوعات</p>
              <h2 className="text-2xl font-black text-white">كل تسجيلات العميل</h2>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <Metric label="الإجمالي" value={formatMoney(totalFinal)} />
              <Metric label="المدفوع" value={formatMoney(totalPaid)} />
              <Metric label="المتبقي" value={formatMoney(remaining)} />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {registrationRows.length ? registrationRows.map((registration) => {
              const company = companiesMap.get(registration.company_id ?? "");
              const course = coursesMap.get(registration.course_id ?? "");
              const sales = profilesMap.get(registration.sales_id ?? "");
              const registrationRemaining = Math.max(0, Number(registration.final_price ?? 0) - Number(registration.paid_amount ?? 0));

              return (
                <article key={registration.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-sky-400/10 px-3 py-1 text-sky-300">{company?.name ?? "مركز غير محدد"}</span>
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-300">{course?.name_ar ?? course?.name ?? course?.code ?? "دورة غير محددة"}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">{registrationLabel(registration.status)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">{paymentLabel(registration.payment_status)}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">السيلز: {sales?.full_name ?? sales?.email ?? "غير محدد"}</p>
                      {registration.notes ? <p className="mt-3 rounded-2xl bg-white/[0.03] p-3 text-sm leading-6 text-slate-300">{registration.notes}</p> : null}
                      {registration.discount_code ? <p className="mt-3 text-sm text-sky-300">كود الخصم: {registration.discount_code}</p> : null}
                    </div>
                    <div className="grid gap-2 text-sm">
                      <Info label="السعر" value={formatMoney(registration.list_price)} />
                      <Info label="الخصم" value={formatMoney(registration.discount_amount)} />
                      <Info label="الصافي" value={formatMoney(registration.final_price)} />
                      <Info label="المدفوع" value={formatMoney(registration.paid_amount)} />
                      <Info label="المتبقي" value={formatMoney(registrationRemaining)} />
                      <Info label="تاريخ التسجيل" value={formatDate(registration.created_at)} />
                    </div>
                  </div>
                </article>
              );
            }) : (
              <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
                لا توجد تسجيلات لهذا العميل حتى الآن.
              </div>
            )}
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">سجل النشاط</h2>
          <div className="mt-5 space-y-3">
            {(activities ?? []).length ? (
              activities?.map((activity: any) => (
                <div key={activity.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-black text-white">{actionLabel(activity.action)}</p>
                    <span className="text-xs text-slate-500">{formatDate(activity.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">بواسطة: {activity.actor_name ?? "النظام"}</p>
                  {(activity.old_value || activity.new_value) ? (
                    <p className="mt-2 text-sm text-slate-300">
                      {activity.old_value ? statusLabel(activity.old_value) + " ← " : ""}{activity.new_value ? statusLabel(activity.new_value) : ""}
                    </p>
                  ) : null}
                  {activity.note ? <p className="mt-3 leading-7 text-slate-300">{activity.note}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-slate-400">لا توجد أحداث مسجلة لهذا العميل حتى الآن.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 font-bold text-slate-100">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
