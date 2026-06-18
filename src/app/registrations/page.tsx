import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { RegistrationsClient } from "./registrations-client";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"]);

export default async function RegistrationsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const scopedUserId = scope.scopedUserId;
  const scopedCompanyId = scope.scopedCompanyId;
  const actingUserId = scope.previewAsUser && scopedUserId ? scopedUserId : user.id;
  const systemSettings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(systemSettings, "features.registrations.enabled", true)) {
    return (
      <AppShell titleKey="registrations" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="safe-card rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-8 text-amber-100">
          <h2 className="text-2xl font-black">{"\u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a \u0645\u062a\u0648\u0642\u0641\u0629 \u062d\u0627\u0644\u064a\u064b\u0627"}</h2>
          <p className="mt-3 text-sm leading-7 text-amber-100/80">{"\u064a\u0645\u0643\u0646 \u062a\u0634\u063a\u064a\u0644 \u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0633\u062c\u064a\u0644\u0627\u062a \u0645\u0646 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645."}</p>
        </div>
      </AppShell>
    );
  }

  if (!allowedRoles.has(role ?? "")) {
    return (
      <AppShell titleKey="registrations" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="safe-card rounded-[2rem] border border-red-400/20 bg-red-400/10 p-8 text-red-100">{"\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629 \u0644\u0635\u0644\u0627\u062d\u064a\u062a\u0643 \u0627\u0644\u062d\u0627\u0644\u064a\u0629."}</div>
      </AppShell>
    );
  }

  let leadsQuery = supabase
    .from("leads")
    .select("id,full_name,phone,email,company_name,company_id,course_id,source,status,priority,owner_id,program,assigned_at,last_contact_at,next_follow_up_at,last_note,customer_status,registration_status,payment_status,registration_amount,discount_amount,final_amount,discount_code,paid_amount,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (scopedUserId) leadsQuery = leadsQuery.eq("owner_id", scopedUserId);
  else if (role === "sales") leadsQuery = leadsQuery.eq("owner_id", user.id);

  if (scopedCompanyId) leadsQuery = leadsQuery.eq("company_id", scopedCompanyId);

  let registrationsQuery = supabase
    .from("registrations")
    .select("id,lead_id,company_id,course_id,sales_id,status,payment_status,list_price,discount_amount,final_price,discount_code,paid_amount,notes,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (scopedUserId) registrationsQuery = registrationsQuery.eq("sales_id", scopedUserId);
  if (scopedCompanyId) registrationsQuery = registrationsQuery.eq("company_id", scopedCompanyId);

  const [{ data: leads }, { data: profiles }, { data: companies }, { data: courses }, { data: registrations }] = await Promise.all([
    leadsQuery,
    supabase.from("profiles").select("id,full_name,role,is_active").eq("is_active", true).order("full_name", { ascending: true }),
    supabase.from("companies").select("id,name,status,commission_type,commission_value").order("name", { ascending: true }),
    supabase.from("courses").select("id,name,name_ar,name_en,company_id,code,price,sale_price,discount_type,discount_value,discount_code,status").order("sort_order", { ascending: true }),
    registrationsQuery,
  ]);

  return (
    <RegistrationsClient
      initialLeads={(leads ?? []) as any}
      profiles={(profiles ?? []) as any}
      trainingCenters={(companies ?? []) as any}
      courses={(courses ?? []) as any}
      initialRegistrations={(registrations ?? []) as any}
      currentUserId={actingUserId}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    />
  );
}