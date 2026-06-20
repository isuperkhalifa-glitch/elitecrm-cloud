import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CommissionsClient } from "./commissions-client";

export default async function CommissionsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  requirePageAccess(role, "commissions");
  const systemSettings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(systemSettings, "features.commissions.enabled", true)) {
    return (
      <AppShell titleKey="commissions" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-amber-800">
          <h2 className="text-2xl font-black">العمولات متوقفة حاليًا</h2>
          <p className="mt-3 text-sm">يمكن تشغيل موديول العمولات من إعدادات النظام.</p>
        </div>
      </AppShell>
    );
  }

  const range = yearDateRange(await getEffectiveYear());
  const admin = createAdminClient();
  const effectiveUserId = scope.scopedUserId ?? (role === "sales" ? user.id : null);

  let commissionsQuery = admin
    .from("commissions")
    .select("id,sales_id,company_id,invoice_id,base_amount,commission_amount,status,created_at,commission_type,commission_value,paid_at,notes,updated_at")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: false });
  if (effectiveUserId) commissionsQuery = commissionsQuery.eq("sales_id", effectiveUserId);
  if (scope.scopedCompanyId) commissionsQuery = commissionsQuery.eq("company_id", scope.scopedCompanyId);

  let invoicesQuery = admin
    .from("invoices")
    .select("id,invoice_number,amount,status,paid_at,company_id,created_at")
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: false });
  if (scope.scopedCompanyId) invoicesQuery = invoicesQuery.eq("company_id", scope.scopedCompanyId);

  let companiesQuery = admin
    .from("companies")
    .select("id,name,commission_type,commission_value")
    .order("name", { ascending: true });
  if (scope.scopedCompanyId) companiesQuery = companiesQuery.eq("id", scope.scopedCompanyId);

  const [commissionsResult, profilesResult, companiesResult, invoicesResult] = await Promise.all([
    commissionsQuery,
    admin.from("profiles").select("id,full_name,role,default_commission_type,default_commission_value,is_active").order("full_name", { ascending: true }),
    companiesQuery,
    invoicesQuery,
  ]);

  return (
    <CommissionsClient
      initialCommissions={(commissionsResult.data ?? []) as any}
      profiles={(profilesResult.data ?? []) as any}
      companies={(companiesResult.data ?? []) as any}
      invoices={(invoicesResult.data ?? []) as any}
      currentUserId={effectiveUserId ?? user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    />
  );
}
