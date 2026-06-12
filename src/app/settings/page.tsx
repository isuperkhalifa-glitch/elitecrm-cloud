import { ModuleClient } from "@/components/module-client";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";

export default async function ModulePage() {
  const { user, profile } = await getCurrentUserProfile();

  return (
    <ModuleClient
      titleKey="settings"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}

