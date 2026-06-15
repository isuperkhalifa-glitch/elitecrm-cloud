import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { isFeatureEnabled, loadPublicSystemSettings } from "@/lib/settings/server";
import { RegistrationsClient } from "./registrations-client";

const allowedRoles = new Set(["developer", "admin", "manager", "sales", "finance"]);

export default async function RegistrationsPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();
  const role = profile?.role ?? null;
  const systemSettings = await loadPublicSystemSettings(supabase);

  if (!isFeatureEnabled(systemSettings, "features.registrations.enabled", true)) {
    return (
      <AppShell
        titleKey="registrations"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={role}
      >
        <div className="safe-card rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-8 text-amber-100">
          <h2 className="text-2xl font-black">التسجيلات متوقفة حاليًا</h2>
          <p className="mt-3 text-sm leading-7 text-amber-100/80">
            يمكن للأدمن تشغيل صفحة التسجيلات من مركز إعدادات النظام.
          </p>
        </div>
      </AppShell>
    );
  }

  if (!allowedRoles.has(role ?? "")) {
    return (
      <AppShell
        titleKey="registrations"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={role}
      >
        <div className="safe-card rounded-[2rem] border border-red-400/20 bg-red-400/10 p-8 text-red-100">
          هذه الصفحة غير متاحة لصلاحيتك الحالية.
        </div>
      </AppShell>
    );
  }

  let leadsQuery = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (role === "sales") {
    leadsQuery = leadsQuery.eq("owner_id", user.id);
  }

  const [{ data: leads }, { data: profiles }, { data: courses }] = await Promise.all([
    leadsQuery,
    supabase
      .from("profiles")
      .select("id,full_name,role,is_active")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("courses")
      .select("id,code,name,name_ar,name_en,base_price,sale_price,discount_type,discount_value,discount_code,currency,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <RegistrationsClient
      initialLeads={(leads ?? []) as any}
      profiles={(profiles ?? []) as any}
      courses={(courses ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    />
  );
}
