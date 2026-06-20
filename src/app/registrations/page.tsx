import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { RegistrationsClient } from "./registrations-client";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"]);

export default async function RegistrationsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const scopedUserId = scope.scopedUserId;
  const scopedCompanyId = scope.scopedCompanyId;
  const actingUserId = scope.previewAsUser && scopedUserId ? scopedUserId : user.id;
  const systemSettings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(systemSettings, "features.registrations.enabled", true)) {
    return (
      <AppShell titleKey="registrations" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-amber-800">
          <h2 className="text-2xl font-black">التسجيلات متوقفة حاليًا</h2>
          <p className="mt-3 text-sm">يمكن تشغيل صفحة التسجيلات من إعدادات النظام.</p>
        </div>
      </AppShell>
    );
  }

  if (!allowedRoles.has(role ?? "")) {
    return (
      <AppShell titleKey="registrations" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-700">هذه الصفحة غير متاحة لصلاحيتك الحالية.</div>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  let leadsQuery = admin.from("leads").select("*").order("created_at", { ascending: false }).limit(3000);
  if (scopedUserId) leadsQuery = leadsQuery.eq("owner_id", scopedUserId);
  else if (role === "sales") leadsQuery = leadsQuery.eq("owner_id", user.id);
  if (scopedCompanyId) leadsQuery = leadsQuery.eq("company_id", scopedCompanyId);

  let registrationsQuery = admin.from("registrations").select("*").order("created_at", { ascending: false }).limit(3000);
  if (scopedUserId) registrationsQuery = registrationsQuery.eq("sales_id", scopedUserId);
  else if (role === "sales") registrationsQuery = registrationsQuery.eq("sales_id", user.id);
  if (scopedCompanyId) registrationsQuery = registrationsQuery.eq("company_id", scopedCompanyId);

  const results = await Promise.all([
    leadsQuery,
    admin.from("profiles").select("*").eq("is_active", true).order("full_name", { ascending: true }),
    admin.from("companies").select("*").order("name", { ascending: true }),
    admin.from("courses").select("*").order("sort_order", { ascending: true }),
    registrationsQuery,
  ]);

  return (
    <RegistrationsClient
      initialLeads={(results[0].data ?? []) as any}
      profiles={(results[1].data ?? []) as any}
      trainingCenters={(results[2].data ?? []) as any}
      courses={(results[3].data ?? []) as any}
      initialRegistrations={(results[4].data ?? []) as any}
      currentUserId={actingUserId}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    />
  );
}
