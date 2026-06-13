import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { MyCustomersClient } from "./my-customers-client";

export default async function MyCustomersPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const [{ data: leads }, { data: profiles }] = await Promise.all([
    supabase
      .from("leads")
      .select("id,full_name,phone,email,company_name,source,status,priority,owner_id,program,assigned_at,last_contact_at,next_follow_up_at,last_note,customer_status,registration_status,payment_status,transfer_reason,transferred_at,created_at")
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
