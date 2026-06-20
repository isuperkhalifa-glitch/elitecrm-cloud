import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { CommissionsClient } from "./commissions-client";
import { AppShell } from "@/components/app-shell";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CommissionsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "commissions");

  const systemSettings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(systemSettings, "features.commissions.enabled", true)) {
    return (
      <AppShell
        titleKey="commissions"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-amber-800">
          <h2 className="text-2xl font-black">العمولات متوقفة حاليًا</h2>
          <p className="mt-3 text-sm">يمكن تشغيل موديول العمولات من إعدادات النظام.</p>
        </div>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [commissionsResult, profilesResult, companiesResult, invoicesResult] = await Promise.all([
    admin
      .from("commissions")
      .select("id,sales_id,company_id,invoice_id,base_amount,commission_amount,status,created_at,commission_type,commission_value,paid_at,notes,updated_at")
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id,full_name,role,default_commission_type,default_commission_value,is_active")
      .order("full_name", { ascending: true }),
    admin
      .from("companies")
      .select("id,name,commission_type,commission_value")
      .order("name", { ascending: true }),
    admin
      .from("invoices")
      .select("id,invoice_number,amount,status,paid_at,company_id")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <CommissionsClient
      initialCommissions={(commissionsResult.data ?? []) as any}
      profiles={(profilesResult.data ?? []) as any}
      companies={(companiesResult.data ?? []) as any}
      invoices={(invoicesResult.data ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
