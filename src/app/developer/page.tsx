import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";

export default async function DeveloperPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  if (profile?.role !== "developer") {
    return (
      <AppShell titleKey="developer" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded border border-red-200 bg-red-50 p-6 text-red-700">هذه الصفحة متاحة لمطور النظام فقط.</div>
      </AppShell>
    );
  }

  const checks = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("registrations").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
  ]);

  const modules = [
    ["المستخدمون", checks[0].count ?? 0, !checks[0].error],
    ["العملاء", checks[1].count ?? 0, !checks[1].error],
    ["التسجيلات", checks[2].count ?? 0, !checks[2].error],
    ["مراكز التدريب", checks[3].count ?? 0, !checks[3].error],
    ["الدورات", checks[4].count ?? 0, !checks[4].error],
  ] as const;

  return (
    <AppShell titleKey="developer" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(([name, count, ok]) => (
          <div key={name} className="rounded border border-slate-300 bg-white p-5">
            <p className="text-sm text-slate-500">{name}</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold text-[#29455f]">{count}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {ok ? "متصل" : "خطأ"}
              </span>
            </div>
          </div>
        ))}
        <div className="rounded border border-slate-300 bg-white p-5 md:col-span-2 xl:col-span-3">
          <h2 className="text-lg font-semibold text-[#617b96]">حالة نسخة V8</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Info label="الفرع" value="v8-rebuild" />
            <Info label="الإطار" value="Next.js 16" />
            <Info label="قاعدة البيانات" value="Supabase PostgreSQL" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-slate-50 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-[#29455f]">{value}</p>
    </div>
  );
}
