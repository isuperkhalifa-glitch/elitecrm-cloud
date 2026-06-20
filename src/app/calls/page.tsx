import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
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
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const params = await searchParams;
  const selectedYear = await getEffectiveYear();
  const yearRange = yearDateRange(selectedYear);

  if (!allowedRoles.has(role)) {
    return (
      <AppShell
        titleKey="calls"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      >
        <div className="v8-card rounded-md p-8 text-center text-red-600">
          هذه الصفحة غير متاحة لصلاحيتك الحالية.
        </div>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const effectiveUserId = scope.scopedUserId ?? (role === "sales" ? user.id : null);

  function createLeadQuery(fields: string) {
    let query = admin
      .from("leads")
      .select(fields)
      .gte("created_at", yearRange.from)
      .lt("created_at", yearRange.to)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (effectiveUserId) query = query.eq("owner_id", effectiveUserId);
    if (scope.scopedCompanyId) query = query.eq("company_id", scope.scopedCompanyId);
    return query;
  }

  const enhancedResult = await createLeadQuery(enhancedFields);
  const enhancedSchemaReady = !enhancedResult.error;
  let leads = (enhancedResult.data ?? []) as unknown as Record<string, unknown>[];

  if (!enhancedSchemaReady) {
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
      role={profile?.role ?? null}
    >
      <CallsCenterClient
        initialLeads={leads as never[]}
        courses={(courses ?? []) as never[]}
        profiles={(profiles ?? []) as never[]}
        currentUserId={effectiveUserId ?? user.id}
        role={role}
        initialFilter={params.filter ?? "all"}
        enhancedSchemaReady={enhancedSchemaReady}
      />
    </AppShell>
  );
}
