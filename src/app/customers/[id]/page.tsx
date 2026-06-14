
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
  };

  return value ? labels[value] ?? value : "-";
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

  const { data: activities } = await supabase
    .from("customer_activities")
    .select("*")
    .eq("lead_id", resolved.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
      <div className="space-y-5">
        <Link href="/customers" className="inline-flex rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
          رجوع للعملاء
        </Link>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm text-emerald-300">صفحة العميل</p>
          <h1 className="mt-2 text-3xl font-black text-white">{lead.full_name ?? "بدون اسم"}</h1>
          <p className="mt-2 text-slate-400" dir="ltr">
            {lead.country_code ?? ""} {lead.phone_number ?? lead.phone ?? ""}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Info label="الدورة" value={lead.program ?? lead.course_name ?? "-"} />
            <Info label="الحالة" value={statusLabel(lead.customer_status ?? lead.status)} />
            <Info label="نوع العميل" value={lead.lead_type ?? "-"} />
            <Info label="آخر متابعة" value={formatDate(lead.next_follow_up_at)} />
            <Info label="آخر ملاحظة" value={lead.last_note ?? "-"} />
            <Info label="تاريخ الإنشاء" value={formatDate(lead.created_at)} />
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black text-white">رحلة العميل</h2>

          <div className="mt-5 space-y-3">
            {(activities ?? []).length ? (
              activities?.map((activity: any) => (
                <div key={activity.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-black text-white">{activity.action}</p>
                    <span className="text-xs text-slate-500">{formatDate(activity.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">بواسطة: {activity.actor_name ?? "النظام"}</p>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 font-bold text-slate-100">{value}</p>
    </div>
  );
}
