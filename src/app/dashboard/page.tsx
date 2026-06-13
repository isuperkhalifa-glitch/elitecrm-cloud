import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const [
    { data: leads },
    { data: tasks },
    { data: deals },
    { data: invoices },
    { data: commissions },
    { data: profiles },
    { data: companies },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id,full_name,phone,company_name,source,status,priority,owner_id,created_at,program")
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,owner_id,related_type,related_id,created_at")
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("deals")
      .select("id,title,company_id,owner_id,stage,amount,probability,expected_close_date,created_at")
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("invoices")
      .select("id,invoice_number,company_id,deal_id,owner_id,amount,status,paid_at,due_date,created_at")
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("commissions")
      .select("id,sales_id,company_id,invoice_id,commission_amount,status,paid_at,created_at")
      .order("created_at", { ascending: false })
      .limit(1000),

    supabase
      .from("profiles")
      .select("id,full_name,role,is_active")
      .order("full_name", { ascending: true }),

    supabase
      .from("companies")
      .select("id,name")
      .order("name", { ascending: true }),
  ]);

  return (
    <DashboardClient
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
      leads={(leads ?? []) as any}
      tasks={(tasks ?? []) as any}
      deals={(deals ?? []) as any}
      invoices={(invoices ?? []) as any}
      commissions={(commissions ?? []) as any}
      profiles={(profiles ?? []) as any}
      companies={(companies ?? []) as any}
    />
  );
}
