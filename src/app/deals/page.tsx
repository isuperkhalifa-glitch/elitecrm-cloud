import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { DealsClient } from "./deals-client";

export default async function DealsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "deals");

  const [{ data: deals }, { data: companies }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("deals")
        .select("id,title,company_id,contact_id,owner_id,stage,amount,expected_close_date,probability,created_at,companies(id,name),contacts(id,full_name,company_id)")
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id,name")
        .order("name", { ascending: true }),
      supabase
        .from("contacts")
        .select("id,full_name,company_id")
        .order("full_name", { ascending: true }),
    ]);

  return (
    <DealsClient
      initialDeals={(deals ?? []) as any}
      companies={(companies ?? []) as any}
      contacts={(contacts ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
