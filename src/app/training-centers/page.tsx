import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { CompaniesClient } from "../companies/companies-client";

export default async function TrainingCentersPage() {
  const { user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "training-centers");

  const admin = createAdminClient();
  const result = await admin
    .from("companies")
    .select("id,name,industry,website,phone,email,city,country,status,commission_type,commission_value,created_at")
    .order("created_at", { ascending: false });

  let companies = result.data ?? [];
  if (result.error) {
    const fallbackResult = await admin
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
    companies = fallbackResult.data ?? [];
  }

  return (
    <CompaniesClient
      initialCompanies={companies as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
