import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { CoursesClient } from "./courses-client";

export default async function CoursesPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "courses");

  const [{ data: courses }, { data: companies }] = await Promise.all([
    supabase
      .from("courses")
      .select("id,name,name_ar,name_en,company_id,code,accreditation_number,delivery_mode,duration_days,duration_hours,price,sale_price,discount_type,discount_value,discount_code,location,notes,status,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("companies")
      .select("id,name,status,commission_type,commission_value")
      .order("name", { ascending: true }),
  ]);

  return (
    <CoursesClient
      initialCourses={(courses ?? []) as any}
      trainingCenters={(companies ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
