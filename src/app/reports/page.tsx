import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";

export default async function ReportsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const [{ data: leads }, { data: registrations }, { data: profiles }] = await Promise.all([
    supabase.from("leads").select("id,status,customer_status,owner_id,created_at").limit(5000),
    supabase.from("registrations").select("id,sales_id,payment_status,paid_amount,final_price,created_at").limit(5000),
    supabase.from("profiles").select("id,full_name,email,role,is_active").eq("is_active", true),
  ]);

  const salesProfiles = (profiles ?? []).filter((item: any) => item.role === "sales" || item.role === "manager");
  const rows = salesProfiles.map((person: any) => {
    const personLeads = (leads ?? []).filter((item: any) => item.owner_id === person.id);
    const paidRows = (registrations ?? []).filter((item: any) => item.sales_id === person.id && item.payment_status === "paid");
    return {
      id: person.id,
      name: person.full_name ?? person.email ?? "-",
      leads: personLeads.length,
      paid: paidRows.length,
      revenue: paidRows.reduce((sum: number, item: any) => sum + Number(item.paid_amount ?? 0), 0),
      conversion: personLeads.length ? Math.round((paidRows.length / personLeads.length) * 1000) / 10 : 0,
    };
  }).sort((a: any, b: any) => b.revenue - a.revenue);

  return (
    <AppShell titleKey="reports" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
      <div className="space-y-4">
        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="text-xl font-semibold text-[#617b96]">تقارير أداء فريق المبيعات</h2>
          <p className="mt-1 text-sm text-slate-400">ملخص موحد للعملاء والتسجيلات والتحصيل ونسبة التحويل.</p>
        </section>

        <section className="overflow-hidden rounded border border-slate-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#29455f] text-white">
                <tr>
                  <th className="px-4 py-3 text-start">الموظف</th>
                  <th className="px-4 py-3 text-center">العملاء</th>
                  <th className="px-4 py-3 text-center">المدفوع</th>
                  <th className="px-4 py-3 text-center">نسبة التحويل</th>
                  <th className="px-4 py-3 text-center">التحصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold">{row.name}</td>
                    <td className="px-4 py-3 text-center">{row.leads}</td>
                    <td className="px-4 py-3 text-center">{row.paid}</td>
                    <td className="px-4 py-3 text-center">{row.conversion}%</td>
                    <td className="px-4 py-3 text-center">{row.revenue.toLocaleString()} ر.س</td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">لا توجد بيانات بعد.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
