import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const { data: leads } = await supabase
    .from("leads")
    .select("id,full_name,phone,email,company_name,source,status,priority,created_at")
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
