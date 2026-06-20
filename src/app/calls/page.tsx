import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { CallsCenterClient } from "./calls-center-client";
import { enhancedFields, fallbackFields, normalizeLegacyCall } from "./calls-data";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator", "sales"]);

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { user, profile } = await getCurrentUserProfile();
  const role = profile?.role ?? "sales";
  const params = await searchParams;

  if (!allowedRoles.has(role)) {
    return (
      <AppShell
        titleKey="calls"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={role}
      >
        <div className="v8-card rounded-md p-8 text-center text-red-600">
          هذه الصفحة غير متاحة لصلاحيتك الحالية.
        </div>
      </AppShell>
    );
  }

  const admin = createAdminClient();

  function createLeadQuery(fields: string) {
    let query = admin
      .from("leads")
      .select(fields)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (role === "sales") query = query.eq("owner_id", user.id);
    return query;
  }

  const enhancedResult = await createLeadQuery(enhancedFields);
  let leads = (enhancedResult.data ?? []) as unknown as Record<string, unknown>[];

  if (enhancedResult.error) {
    const fallback = await createLeadQuery(fallbackFields);
    const fallbackRows = (fallback.data ?? []) as unknown as Record<string, unknown>[];
    leads = fallbackRows.map(normalizeLegacyCall);
  }

  const [{ data: courses }, { data: profiles }] = await Promise.all([
    admin
      .from("courses")
      .select("id,name,name_ar,name_en,status")
      .order("sort_order", { ascending: true }),
    admin
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  return (
    <AppShell
      titleKey="calls"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    >
      <CallsCenterClient
        initialLeads={leads as never[]}
        courses={(courses ?? []) as never[]}
        profiles={(profiles ?? []) as never[]}
        currentUserId={user.id}
        role={role}
        initialFilter={params.filter ?? "all"}
        enhancedSchemaReady
      />
    </AppShell>
  );
}
