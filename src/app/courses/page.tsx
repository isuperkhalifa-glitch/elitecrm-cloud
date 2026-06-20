import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { CoursesClient } from "./courses-client";

export default async function CoursesPage() {
  const { user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "courses");

  const admin = createAdminClient();
  const [{ data: courses }, { data: companies }] = await Promise.all([
    admin.from("courses").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    admin.from("companies").select("*").order("name", { ascending: true }),
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
