import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { DistributionClient } from "./distribution-client";

export default async function DistributionPage() {
  const { user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "distribution");

  const admin = createAdminClient();
  const [{ data: leads }, { data: profiles }] = await Promise.all([
    admin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000),
    admin
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  return (
    <DistributionClient
      initialLeads={(leads ?? []) as never[]}
      profiles={(profiles ?? []) as never[]}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
