import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarClient } from "./calendar-client";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator", "sales"]);

export default async function CalendarPage() {
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;

  if (!allowedRoles.has(role)) {
    return (
      <AppShell titleKey="calendar" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">هذه الصفحة غير متاحة لصلاحيتك الحالية.</div>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const effectiveUserId = scope.scopedUserId ?? (role === "sales" ? user.id : null);

  let leadsQuery = admin
    .from("leads")
    .select("id,customer_code,full_name,phone,owner_id,company_id,status,customer_status,program,next_follow_up_at")
    .order("created_at", { ascending: false });

  let tasksQuery = admin
    .from("tasks")
    .select("*")
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  if (effectiveUserId) {
    leadsQuery = leadsQuery.eq("owner_id", effectiveUserId);
    tasksQuery = tasksQuery.eq("owner_id", effectiveUserId);
  }
  if (scope.scopedCompanyId) leadsQuery = leadsQuery.eq("company_id", scope.scopedCompanyId);

  const [leadResult, taskResult, profileResult] = await Promise.all([
    leadsQuery.limit(5000),
    tasksQuery.limit(5000),
    admin.from("profiles").select("id,full_name,email,role,is_active").eq("is_active", true).order("full_name", { ascending: true }),
  ]);

  let leads = leadResult.data ?? [];
  if (leadResult.error) {
    let fallback = admin
      .from("leads")
      .select("id,full_name,phone,owner_id,status,next_follow_up_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (effectiveUserId) fallback = fallback.eq("owner_id", effectiveUserId);
    const fallbackResult = await fallback;
    leads = (fallbackResult.data ?? []).map((lead) => ({
      ...lead,
      customer_code: null,
      company_id: null,
      customer_status: lead.status ?? null,
      program: null,
    })) as never[];
  }

  const visibleLeadIds = new Set(leads.map((lead: Record<string, unknown>) => String(lead.id)));
  const tasks = taskResult.data ?? [];
  const visibleTasks = scope.scopedCompanyId
    ? tasks.filter((task: Record<string, unknown>) => {
        const relatedType = String(task.related_type ?? "");
        const relatedId = task.related_id ? String(task.related_id) : null;
        if (relatedType === "lead" && relatedId) return visibleLeadIds.has(relatedId);
        return relatedType === "company" && relatedId === scope.scopedCompanyId;
      })
    : tasks;

  return (
    <AppShell titleKey="calendar" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role}>
      <CalendarClient
        leads={leads as never[]}
        tasks={visibleTasks as never[]}
        profiles={(profileResult.data ?? []) as never[]}
        currentUserId={user.id}
        role={role}
      />
    </AppShell>
  );
}
