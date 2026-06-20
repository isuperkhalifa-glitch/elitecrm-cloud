import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { createAdminClient } from "@/lib/supabase/admin";
import { DataQualityClient } from "./data-quality-client";

export default async function DataQualityPage() {
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  requirePageAccess(role, "data-quality");
  const range = yearDateRange(await getEffectiveYear());

  const admin = createAdminClient();
  let query = admin
    .from("leads")
    .select("id,customer_code,full_name,phone,country_code,phone_number,source,status,customer_status,owner_id,company_id,created_at")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (scope.scopedUserId) query = query.eq("owner_id", scope.scopedUserId);
  if (scope.scopedCompanyId) query = query.eq("company_id", scope.scopedCompanyId);

  const leadsResult = await query;
  let leads = leadsResult.data ?? [];

  if (leadsResult.error) {
    let fallbackQuery = admin
      .from("leads")
      .select("id,full_name,phone,source,status,owner_id,created_at")
      .gte("created_at", range.from)
      .lt("created_at", range.to)
      .order("created_at", { ascending: false })
      .limit(10000);
    if (scope.scopedUserId) fallbackQuery = fallbackQuery.eq("owner_id", scope.scopedUserId);
    const fallback = await fallbackQuery;
    leads = (fallback.data ?? []).map((lead) => ({
      ...lead,
      customer_code: null,
      country_code: null,
      phone_number: null,
      customer_status: lead.status ?? null,
    })) as never[];
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,full_name,email")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return (
    <AppShell titleKey="dataQuality" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
      <DataQualityClient leads={leads as never[]} profiles={(profiles ?? []) as never[]} />
    </AppShell>
  );
}
