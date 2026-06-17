import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { CustomerDetailsClient } from "./customer-details-client";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export default async function CustomerPage({ params }: Props) {
  const resolved = await params;
  const customerKey = decodeURIComponent(resolved.id);
  const { supabase, user, profile } = await getCurrentUserProfile();
  const role = profile?.role ?? null;

  requirePageAccess(role, "customers");

  let lead: any = null;
  const byCode = await supabase.from("leads").select("*").eq("customer_code", customerKey).maybeSingle();
  lead = byCode.data;

  if (!lead && looksLikeUuid(customerKey)) {
    const byId = await supabase.from("leads").select("*").eq("id", customerKey).maybeSingle();
    lead = byId.data;
  }

  if (!lead) {
    return (
      <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role}>
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-100">
          العميل غير موجود أو تم حذفه.
        </div>
      </AppShell>
    );
  }

  if (role === "sales" && lead.owner_id && lead.owner_id !== user.id) {
    return (
      <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role}>
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-100">
          هذا العميل غير متاح لصلاحيتك الحالية.
        </div>
      </AppShell>
    );
  }

  const [{ data: activities }, { data: registrations }, { data: profiles }, { data: companies }, { data: courses }] = await Promise.all([
    supabase
      .from("customer_activities")
      .select("id,actor_name,action,old_value,new_value,note,created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(150),
    supabase
      .from("registrations")
      .select("id,lead_id,company_id,course_id,sales_id,status,payment_status,list_price,discount_amount,final_price,discount_code,paid_amount,notes,created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("companies")
      .select("id,name")
      .order("name", { ascending: true }),
    supabase
      .from("courses")
      .select("id,name,name_ar,name_en,company_id,price,sale_price")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <AppShell titleKey="customers" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={role}>
      <CustomerDetailsClient
        initialLead={lead as any}
        activities={(activities ?? []) as any}
        initialRegistrations={(registrations ?? []) as any}
        profiles={(profiles ?? []) as any}
        companies={(companies ?? []) as any}
        courses={(courses ?? []) as any}
        currentUserId={user.id}
        currentUserName={profile?.full_name ?? user.email ?? "النظام"}
        role={role}
      />
    </AppShell>
  );
}