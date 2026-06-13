import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const { data: leads } = await supabase
    .from("leads")
    .select("id,full_name,phone,email,company_name,source,status,priority,owner_id,program,assigned_at,last_contact_at,next_follow_up_at,last_note,customer_status,registration_status,payment_status,transferred_from,transferred_to,transfer_reason,transferred_at,created_at")
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



