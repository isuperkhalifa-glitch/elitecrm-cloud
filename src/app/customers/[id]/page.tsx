import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerDetailsClient } from "./customer-details-client";

type Props = { params: Promise<{ id: string }> | { id: string } };

export default async function CustomerPage({ params }: Props) {
  const resolved = await params;
  const key = decodeURIComponent(resolved.id);
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  requirePageAccess(role, "customers");

  const admin = createAdminClient();
  let query = admin.from("leads").select("*");
  query = key.toUpperCase().startsWith("CUST-")
    ? query.eq("customer_code", key)
    : query.eq("id", key);

  if (scope.scopedUserId) query = query.eq("owner_id", scope.scopedUserId);
  else if (role === "sales") query = query.eq("owner_id", user.id);
  if (scope.scopedCompanyId) query = query.eq("company_id", scope.scopedCompanyId);

  const { data: lead } = await query.maybeSingle();

  if (!lead) {
    return (
      <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-700">
          العميل غير موجود أو خارج نطاق صلاحيتك الحالية.
        </div>
      </AppShell>
    );
  }

  const results = await Promise.all([
    admin.from("customer_activities").select("id,actor_name,action,old_value,new_value,note,created_at").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(150),
    admin.from("registrations").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false }),
    admin.from("profiles").select("id,full_name,email,role,is_active").eq("is_active", true).order("full_name", { ascending: true }),
    admin.from("companies").select("id,name").order("name", { ascending: true }),
    admin.from("courses").select("id,name,name_ar,name_en,company_id,price,sale_price").order("sort_order", { ascending: true }),
  ]);

  return (
    <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
      <CustomerDetailsClient
        initialLead={lead as any}
        activities={(results[0].data ?? []) as any}
        initialRegistrations={(results[1].data ?? []) as any}
        profiles={(results[2].data ?? []) as any}
        companies={(results[3].data ?? []) as any}
        courses={(results[4].data ?? []) as any}
        currentUserId={user.id}
        currentUserName={profile?.full_name ?? user.email ?? "النظام"}
        role={role}
      />
    </AppShell>
  );
}
