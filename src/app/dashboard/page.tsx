import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const scopedUserId = scope.scopedUserId;
  const scopedCompanyId = scope.scopedCompanyId;

  let leadsQuery = supabase
    .from("leads")
    .select("id,full_name,owner_id,company_id,status,customer_status,lead_type,source,created_at,next_follow_up_at");
  let registrationsQuery = supabase
    .from("registrations")
    .select("id,lead_id,sales_id,company_id,status,payment_status,final_price,paid_amount,created_at");
  let tasksQuery = supabase
    .from("tasks")
    .select("id,title,status,due_date,owner_id,created_at");
  let activitiesQuery = supabase
    .from("customer_activities")
    .select("id,lead_id,actor_name,action,created_at")
    .order("created_at", { ascending: false })
    .limit(1500);

  if (scopedUserId) {
    leadsQuery = leadsQuery.eq("owner_id", scopedUserId);
    registrationsQuery = registrationsQuery.eq("sales_id", scopedUserId);
    tasksQuery = tasksQuery.eq("owner_id", scopedUserId);
  } else if (role === "sales") {
    leadsQuery = leadsQuery.eq("owner_id", user.id);
    registrationsQuery = registrationsQuery.eq("sales_id", user.id);
    tasksQuery = tasksQuery.eq("owner_id", user.id);
  }

  if (scopedCompanyId) {
    leadsQuery = leadsQuery.eq("company_id", scopedCompanyId);
    registrationsQuery = registrationsQuery.eq("company_id", scopedCompanyId);
  }

  const [
    { data: leads },
    { data: registrations },
    { data: tasks },
    { data: activities },
    { data: profiles },
    { data: companies },
  ] = await Promise.all([
    leadsQuery.order("created_at", { ascending: false }).limit(3000),
    registrationsQuery.order("created_at", { ascending: false }).limit(2000),
    tasksQuery.order("due_date", { ascending: true }).limit(1000),
    activitiesQuery,
    supabase.from("profiles").select("id,full_name,email,role,is_active,created_at").eq("is_active", true).order("full_name"),
    supabase.from("companies").select("id,name").order("name"),
  ]);

  return (
    <DashboardClient
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
      leads={(leads ?? []) as any}
      registrations={(registrations ?? []) as any}
      tasks={(tasks ?? []) as any}
      activities={(activities ?? []) as any}
      profiles={(profiles ?? []) as any}
      companies={(companies ?? []) as any}
    />
  );
}
