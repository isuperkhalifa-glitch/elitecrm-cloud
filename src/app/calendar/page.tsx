import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;

  let leadsQuery = supabase
    .from("leads")
    .select("id,full_name,owner_id,status,next_follow_up_at,phone")
    .not("next_follow_up_at", "is", null)
    .order("next_follow_up_at");
  let tasksQuery = supabase
    .from("tasks")
    .select("id,title,status,due_date,owner_id,related_id")
    .not("due_date", "is", null)
    .order("due_date");

  if (scope.scopedUserId) {
    leadsQuery = leadsQuery.eq("owner_id", scope.scopedUserId);
    tasksQuery = tasksQuery.eq("owner_id", scope.scopedUserId);
  } else if (role === "sales") {
    leadsQuery = leadsQuery.eq("owner_id", user.id);
    tasksQuery = tasksQuery.eq("owner_id", user.id);
  }

  const [{ data: leads }, { data: tasks }] = await Promise.all([
    leadsQuery.limit(1500),
    tasksQuery.limit(1500),
  ]);

  return (
    <AppShell titleKey="calendar" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role}>
      <CalendarClient leads={(leads ?? []) as any} tasks={(tasks ?? []) as any} />
    </AppShell>
  );
}
