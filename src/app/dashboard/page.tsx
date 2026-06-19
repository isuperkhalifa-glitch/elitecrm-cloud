import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const scopedUserId = scope.scopedUserId;
  const scopedCompanyId = scope.scopedCompanyId;
  const admin = createAdminClient();

  let leadsQuery = admin
    .from("leads")
    .select("id,full_name,owner_id,company_id,status,customer_status,lead_type,source,queue_type,created_at,next_follow_up_at,paid_amount");
  let registrationsQuery = admin
    .from("registrations")
    .select("id,lead_id,sales_id,company_id,status,payment_status,final_price,paid_amount,created_at");
  let tasksQuery = admin
    .from("tasks")
    .select("id,title,status,due_date,owner_id,related_id,created_at");

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
    { data: callLogs },
    { data: attendanceLogs },
    { data: announcements },
  ] = await Promise.all([
    leadsQuery.order("created_at", { ascending: false }).limit(10000),
    registrationsQuery.order("created_at", { ascending: false }).limit(5000),
    tasksQuery.order("due_date", { ascending: true }).limit(3000),
    admin
      .from("customer_activities")
      .select("id,lead_id,actor_id,actor_name,action,created_at")
      .order("created_at", { ascending: false })
      .limit(3000),
    admin
      .from("profiles")
      .select("id,full_name,email,role,is_active,created_at")
      .eq("is_active", true)
      .order("full_name"),
    admin.from("companies").select("id,name").order("name"),
    admin.from("call_logs").select("*").order("created_at", { ascending: false }).limit(10000),
    admin.from("attendance_logs").select("*").order("created_at", { ascending: false }).limit(3000),
    admin.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(30),
  ]);

  const visibleLeads = leads ?? [];
  const visibleLeadIds = new Set(visibleLeads.map((lead) => lead.id));
  const effectiveUserId = scopedUserId ?? (role === "sales" ? user.id : null);

  const visibleCalls = (callLogs ?? []).filter((call: any) => {
    const actorId = call.actor_id ?? call.sales_id ?? null;
    if (effectiveUserId && actorId !== effectiveUserId) return false;
    if (scopedCompanyId && call.lead_id && !visibleLeadIds.has(call.lead_id)) return false;
    return true;
  });

  const visibleActivities = (activities ?? []).filter((activity: any) => {
    if (activity.lead_id && !visibleLeadIds.has(activity.lead_id)) return false;
    if (effectiveUserId && activity.actor_id && activity.actor_id !== effectiveUserId) return false;
    return true;
  });

  const visibleAttendance = (attendanceLogs ?? []).filter((entry: any) => {
    if (!effectiveUserId) return true;
    return entry.user_id === effectiveUserId;
  });

  const visibleAnnouncements = (announcements ?? []).filter((item: any) => {
    if (!item.audience_role) return true;
    return item.audience_role === role || ["developer", "admin"].includes(role);
  });

  return (
    <DashboardClient
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
      leads={visibleLeads as any}
      registrations={(registrations ?? []) as any}
      tasks={(tasks ?? []) as any}
      activities={visibleActivities as any}
      profiles={(profiles ?? []) as any}
      companies={(companies ?? []) as any}
      callLogs={visibleCalls as any}
      attendanceLogs={visibleAttendance as any}
      announcements={visibleAnnouncements as any}
    />
  );
}
