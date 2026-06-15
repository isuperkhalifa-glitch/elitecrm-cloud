import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { CoursesClient } from "./courses-client";

const allowedRoles = new Set(["developer", "admin", "manager"]);
const selectColumns = "id,code,name,name_ar,name_en,category,delivery_mode,duration_days,duration_hours,accreditation_number,provider,base_price,sale_price,discount_type,discount_value,discount_code,currency,start_date,end_date,location,description,notes,is_active,sort_order,created_at,updated_at";

export default async function CoursesPage() {
  const { user, profile } = await getCurrentUserProfile();
  const role = profile?.role ?? null;

  if (!allowedRoles.has(role ?? "")) {
    return (
      <AppShell titleKey="courses" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role}>
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-100">
          <h2 className="text-2xl font-black">{"غير مسموح"}</h2>
          <p className="mt-3 text-sm leading-7 text-red-100/80">{"إدارة الدورات متاحة للمطور أو الأدمن أو المدير فقط."}</p>
        </div>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const { data: courses } = await admin.from("courses").select(selectColumns).order("sort_order", { ascending: true }).order("created_at", { ascending: false });

  return <CoursesClient initialCourses={(courses ?? []) as any} userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role} />;
}
