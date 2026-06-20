import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { RegistrationsClient } from "./registrations-client";
import { loadRegistrationsPageData } from "./registrations-page-data";

const roles = new Set(["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"]);

export default async function Page() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const settings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(settings, "features.registrations.enabled", true) || !roles.has(role)) {
    return (
      <AppShell titleKey="registrations" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-amber-800">
          صفحة التسجيلات غير متاحة حاليًا.
        </div>
      </AppShell>
    );
  }

  const data = await loadRegistrationsPageData(user.id, role, scope, yearDateRange(await getEffectiveYear()));

  return (
    <RegistrationsClient
      initialLeads={data.leads as any}
      profiles={data.profiles as any}
      trainingCenters={data.companies as any}
      courses={data.courses as any}
      initialRegistrations={data.registrations as any}
      currentUserId={data.effectiveUserId ?? user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    />
  );
}
