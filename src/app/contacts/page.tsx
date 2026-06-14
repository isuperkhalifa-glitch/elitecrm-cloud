import { ModuleClient } from "@/components/module-client";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";

export default async function ModulePage() {
  const { user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "contacts");

  return (
    <ModuleClient
      titleKey="contacts"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
