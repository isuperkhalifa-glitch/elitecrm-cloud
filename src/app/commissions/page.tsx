import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { CommissionsClient } from "./commissions-client";

export default async function CommissionsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const [
    { data: commissions },
    { data: profiles },
    { data: companies },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from("commissions")
      .select("id,sales_id,company_id,invoice_id,base_amount,commission_amount,status,created_at,commission_type,commission_value,paid_at,notes,updated_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id,full_name,role,default_commission_type,default_commission_value,is_active")
      .order("full_name", { ascending: true }),
    supabase
      .from("companies")
      .select("id,name,commission_type,commission_value")
      .order("name", { ascending: true }),
    supabase
      .from("invoices")
      .select("id,invoice_number,amount,status,paid_at,company_id")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <CommissionsClient
      initialCommissions={(commissions ?? []) as any}
      profiles={(profiles ?? []) as any}
      companies={(companies ?? []) as any}
      invoices={(invoices ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
