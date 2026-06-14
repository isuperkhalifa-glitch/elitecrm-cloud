import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { MyCustomersClient } from "./my-customers-client";

export default async function MyCustomersPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const [{ data: leads }, { data: profiles }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("profiles")
      .select("id,full_name,role,is_active")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  return (
    <MyCustomersClient
      initialLeads={(leads ?? []) as any}
      profiles={(profiles ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
