import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const scopedUserId = scope.scopedUserId;
  const scopedCompanyId = scope.scopedCompanyId;
  const actingUserId = scope.previewAsUser && scopedUserId ? scopedUserId : user.id;

  const systemSettings = await loadPublicSystemSettings(supabase);
  const invoicesEnabled = isFeatureEnabled(systemSettings, "features.invoices.enabled", true);
  const commissionsEnabled = isFeatureEnabled(systemSettings, "features.commissions.enabled", true);

  let leadsQuery = supabase
    .from("leads")
    .select("id,full_name,phone,company_name,company_id,source,status,priority,owner_id,created_at,program")
    .order("created_at", { ascending: false })
    .limit(1000);

  let tasksQuery = supabase
    .from("tasks")
    .select("id,title,status,priority,due_date,owner_id,related_type,related_id,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  let dealsQuery = supabase
    .from("deals")
    .select("id,title,company_id,owner_id,stage,amount,probability,expected_close_date,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  let invoiceQuery = invoicesEnabled
    ? supabase
        .from("invoices")
        .select("id,invoice_number,company_id,deal_id,owner_id,amount,status,paid_at,due_date,created_at")
        .order("created_at", { ascending: false })
        .limit(1000)
    : Promise.resolve({ data: [] });

  let commissionQuery = commissionsEnabled
    ? supabase
        .from("commissions")
        .select("id,sales_id,company_id,invoice_id,commission_amount,status,paid_at,created_at")
        .order("created_at", { ascending: false })
        .limit(1000)
    : Promise.resolve({ data: [] });

  if (scopedUserId) {
    leadsQuery = leadsQuery.eq("owner_id", scopedUserId);
    tasksQuery = tasksQuery.eq("owner_id", scopedUserId);
    dealsQuery = dealsQuery.eq("owner_id", scopedUserId);
    if (invoicesEnabled && "eq" in invoiceQuery) invoiceQuery = invoiceQuery.eq("owner_id", scopedUserId);
    if (commissionsEnabled && "eq" in commissionQuery) commissionQuery = commissionQuery.eq("sales_id", scopedUserId);
  } else if (role === "sales") {
    leadsQuery = leadsQuery.eq("owner_id", user.id);
    tasksQuery = tasksQuery.eq("owner_id", user.id);
    dealsQuery = dealsQuery.eq("owner_id", user.id);
    if (invoicesEnabled && "eq" in invoiceQuery) invoiceQuery = invoiceQuery.eq("owner_id", user.id);
    if (commissionsEnabled && "eq" in commissionQuery) commissionQuery = commissionQuery.eq("sales_id", user.id);
  }

  if (scopedCompanyId) {
    leadsQuery = leadsQuery.eq("company_id", scopedCompanyId);
    dealsQuery = dealsQuery.eq("company_id", scopedCompanyId);
    if (invoicesEnabled && "eq" in invoiceQuery) invoiceQuery = invoiceQuery.eq("company_id", scopedCompanyId);
    if (commissionsEnabled && "eq" in commissionQuery) commissionQuery = commissionQuery.eq("company_id", scopedCompanyId);
  }

  const [
    { data: leads },
    { data: tasks },
    { data: deals },
    { data: invoices },
    { data: commissions },
    { data: profiles },
    { data: companies },
  ] = await Promise.all([
    leadsQuery,
    tasksQuery,
    dealsQuery,
    invoiceQuery,
    commissionQuery,
    supabase.from("profiles").select("id,full_name,role,is_active").order("full_name", { ascending: true }),
    supabase.from("companies").select("id,name").order("name", { ascending: true }),
  ]);

  return (
    <DashboardClient
      currentUserId={actingUserId}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
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