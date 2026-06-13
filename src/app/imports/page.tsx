import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { ImportsClient } from "./imports-client";

export default async function ImportsPage() {
  const { user, profile } = await getCurrentUserProfile();

  return (
    <ImportsClient
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
