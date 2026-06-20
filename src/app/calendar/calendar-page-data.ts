import type { EffectiveScope } from "@/lib/auth/effective-scope";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loadCalendarPageData(
  userId: string,
  role: string,
  scope: EffectiveScope,
  range: { from: string; to: string }
) {
  const admin = createAdminClient();
  const effectiveUserId = scope.scopedUserId ?? (role === "sales" ? userId : null);

  let leadsQuery = admin
    .from("leads")
    .select("id,customer_code,full_name,phone,owner_id,company_id,status,customer_status,program,next_follow_up_at")
    .not("next_follow_up_at", "is", null)
    .gte("next_follow_up_at", range.from)
    .lt("next_follow_up_at", range.to)
    .order("next_follow_up_at", { ascending: true })
    .limit(5000);

  let tasksQuery = admin
    .from("tasks")
    .select("*")
    .not("due_date", "is", null)
    .gte("due_date", range.from)
    .lt("due_date", range.to)
    .order("due_date", { ascending: true })
    .limit(5000);

  if (effectiveUserId) {
    leadsQuery = leadsQuery.eq("owner_id", effectiveUserId);
    tasksQuery = tasksQuery.eq("owner_id", effectiveUserId);
  }
  if (scope.scopedCompanyId) leadsQuery = leadsQuery.eq("company_id", scope.scopedCompanyId);

  const [leadResult, taskResult, profileResult] = await Promise.all([
    leadsQuery,
    tasksQuery,
    admin.from("profiles").select("id,full_name,email,role,is_active").eq("is_active", true).order("full_name"),
  ]);

  let leads = leadResult.data ?? [];
  if (leadResult.error) {
    let fallback = admin
      .from("leads")
      .select("id,full_name,phone,owner_id,status,next_follow_up_at")
      .not("next_follow_up_at", "is", null)
      .gte("next_follow_up_at", range.from)
      .lt("next_follow_up_at", range.to)
      .order("next_follow_up_at", { ascending: true })
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

  const leadIds = new Set(leads.map((lead: Record<string, unknown>) => String(lead.id)));
  const tasks = taskResult.data ?? [];
  const visibleTasks = scope.scopedCompanyId
    ? tasks.filter((task: Record<string, unknown>) => {
        const relatedType = String(task.related_type ?? "");
        const relatedId = task.related_id ? String(task.related_id) : null;
        if (relatedType === "lead" && relatedId) return leadIds.has(relatedId);
        return relatedType === "company" && relatedId === scope.scopedCompanyId;
      })
    : tasks;

  return {
    leads,
    tasks: visibleTasks,
    profiles: profileResult.data ?? [],
    effectiveUserId,
  };
}
