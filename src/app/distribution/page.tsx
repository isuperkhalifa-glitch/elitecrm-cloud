import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { createAdminClient } from "@/lib/supabase/admin";
import { DistributionWorkspace as DistributionClient } from "./distribution-workspace";

export default async function DistributionPage() {
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const year = await getEffectiveYear();
  const range = yearDateRange(year);
  requirePageAccess(role, "distribution");

  const admin = createAdminClient();
  let query = admin
    .from("leads")
    .select("*")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (scope.scopedUserId) query = query.eq("owner_id", scope.scopedUserId);
  if (scope.scopedCompanyId) query = query.eq("company_id", scope.scopedCompanyId);

  const leadResult = await query;
  const profileResult = await admin
    .from("profiles")
    .select("id,full_name,email,role,is_active")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return (
    <DistributionClient
      initialLeads={(leadResult.data ?? []) as never[]}
      profiles={(profileResult.data ?? []) as never[]}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    />
  );
}
