import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { DataQualityClient } from "./data-quality-client";

export default async function DataQualityPage() {
  const { user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "data-quality");

  const admin = createAdminClient();
  const leadsResult = await admin
    .from("leads")
    .select("id,customer_code,full_name,phone,country_code,phone_number,source,status,customer_status,owner_id,created_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  let leads = leadsResult.data ?? [];
  if (leadsResult.error) {
    const fallback = await admin
      .from("leads")
      .select("id,full_name,phone,source,status,owner_id,created_at")
      .order("created_at", { ascending: false })
      .limit(10000);
    leads = (fallback.data ?? []).map((lead) => ({
      ...lead,
      customer_code: null,
      country_code: null,
      phone_number: null,
      customer_status: lead.status ?? null,
    })) as never[];
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id,full_name,email")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return (
    <AppShell
      titleKey="dataQuality"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    >
      <DataQualityClient
        leads={leads as never[]}
        profiles={(profiles ?? []) as never[]}
      />
    </AppShell>
  );
}
