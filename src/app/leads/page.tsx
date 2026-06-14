import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "leads");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <LeadsClient
      initialLeads={leads ?? []}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
