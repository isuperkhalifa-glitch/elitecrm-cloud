import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { CompaniesClient } from "./companies-client";

export default async function CompaniesPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  const { data: companies } = await supabase
    .from("companies")
    .select(
      "id,name,industry,website,phone,email,city,country,status,commission_type,commission_value,created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <CompaniesClient
      initialCompanies={companies ?? []}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
