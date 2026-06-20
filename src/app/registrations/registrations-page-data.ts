import type { EffectiveScope } from "@/lib/auth/effective-scope";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loadRegistrationsPageData(
  userId: string,
  role: string,
  scope: EffectiveScope,
  range: { from: string; to: string }
) {
  const admin = createAdminClient();
  const effectiveUserId = scope.scopedUserId ?? (role === "sales" ? userId : null);

  let leadsQuery = admin
    .from("leads")
    .select("*")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: false })
    .limit(3000);
  if (effectiveUserId) leadsQuery = leadsQuery.eq("owner_id", effectiveUserId);
  if (scope.scopedCompanyId) leadsQuery = leadsQuery.eq("company_id", scope.scopedCompanyId);

  let registrationsQuery = admin
    .from("registrations")
    .select("*")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: false })
    .limit(3000);
  if (effectiveUserId) registrationsQuery = registrationsQuery.eq("sales_id", effectiveUserId);
  if (scope.scopedCompanyId) registrationsQuery = registrationsQuery.eq("company_id", scope.scopedCompanyId);

  const results = await Promise.all([
    leadsQuery,
    admin.from("profiles").select("*").eq("is_active", true).order("full_name"),
    admin.from("companies").select("*").order("name"),
    admin.from("courses").select("*").order("sort_order"),
    registrationsQuery,
  ]);

  return {
    leads: results[0].data ?? [],
    profiles: results[1].data ?? [],
    companies: results[2].data ?? [],
    courses: results[3].data ?? [],
    registrations: results[4].data ?? [],
    effectiveUserId,
  };
}
