import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const [{ data: invoices }, { data: companies }, { data: deals }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id,company_id,deal_id,invoice_number,amount,status,paid_at,created_at,due_date,notes,currency,owner_id,companies(id,name),deals(id,title,amount,stage,owner_id)")
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id,name")
        .order("name", { ascending: true }),
      supabase
        .from("deals")
        .select("id,title,amount,stage,company_id,companies(id,name)")
        .order("created_at", { ascending: false }),
    ]);

  return (
    <InvoicesClient
      initialInvoices={(invoices ?? []) as any}
      companies={(companies ?? []) as any}
      deals={(deals ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}

