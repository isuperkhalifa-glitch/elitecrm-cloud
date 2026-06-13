import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const { data: users } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active,created_at")
    .order("created_at", { ascending: false });

  return (
    <UsersClient
      initialUsers={(users ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
