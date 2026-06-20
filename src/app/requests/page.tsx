import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { createAdminClient } from "@/lib/supabase/admin";
import { RequestsClient } from "./requests-client";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const params = await searchParams;
  const year = await getEffectiveYear();
  const range = yearDateRange(year);
  const admin = createAdminClient();
  const actingUserId = scope.scopedUserId ?? user.id;

  let requestsQuery = admin
    .from("tasks")
    .select("id,request_code,title,description,request_type,priority,status,due_date,sender_id,receiver_id,owner_id,event_type,result_type,started_at,done_at,done_description,created_at,updated_at")
    .not("request_code", "is", null)
    .gte("created_at", range.from)
    .lt("created_at", range.to)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (scope.scopedUserId || !["developer", "admin", "manager"].includes(role)) {
    requestsQuery = requestsQuery.or(
      `sender_id.eq.${actingUserId},receiver_id.eq.${actingUserId},owner_id.eq.${actingUserId}`
    );
  }

  const [{ data: requests }, { data: profiles }] = await Promise.all([
    requestsQuery,
    admin
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const actingProfile = (profiles ?? []).find((item) => item.id === actingUserId);

  return (
    <AppShell
      titleKey="requests"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    >
      <RequestsClient
        initialRequests={(requests ?? []) as never[]}
        profiles={(profiles ?? []) as never[]}
        currentUserId={actingUserId}
        currentUserName={actingProfile?.full_name ?? actingProfile?.email ?? profile?.full_name ?? user.email ?? ""}
        role={role}
        initialTab={params.tab ?? "incoming"}
      />
    </AppShell>
  );
}
