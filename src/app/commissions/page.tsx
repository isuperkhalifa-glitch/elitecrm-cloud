import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { CommissionsClient } from "./commissions-client";
import { AppShell } from "@/components/app-shell";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { requirePageAccess } from "@/lib/auth/server-guards";

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
        <div className="safe-card rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-8 text-amber-100">
          <h2 className="text-2xl font-black">العمولات متوقفة حاليًا</h2>
          <p className="mt-3 text-sm leading-7 text-amber-100/80">
            تم إيقاف موديول العمولات من مركز إعدادات النظام. يمكن للأدمن تشغيله مرة أخرى من Settings.
          </p>
        </div>
      </AppShell>
    );

  }

  const [
    { data: commissions },
    { data: profiles },
    { data: companies },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from("commissions")
      .select("id,sales_id,company_id,invoice_id,base_amount,commission_amount,status,created_at,commission_type,commission_value,paid_at,notes,updated_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id,full_name,role,default_commission_type,default_commission_value,is_active")
      .order("full_name", { ascending: true }),
    supabase
      .from("companies")
      .select("id,name,commission_type,commission_value")
      .order("name", { ascending: true }),
    supabase
      .from("invoices")
      .select("id,invoice_number,amount,status,paid_at,company_id")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <CommissionsClient
      initialCommissions={(commissions ?? []) as any}
      profiles={(profiles ?? []) as any}
      companies={(companies ?? []) as any}
      invoices={(invoices ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
