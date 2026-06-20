import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { RequestsClient } from "./requests-client";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user, profile } = await getCurrentUserProfile();
  const role = profile?.role ?? "sales";
  const params = await searchParams;
  const admin = createAdminClient();

  let requestsQuery = admin
    .from("tasks")
    .select("id,request_code,title,description,request_type,priority,status,due_date,sender_id,receiver_id,owner_id,event_type,result_type,started_at,done_at,done_description,created_at,updated_at")
    .not("request_code", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (!["developer", "admin", "manager"].includes(role)) {
    requestsQuery = requestsQuery.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
  }

  const [{ data: requests }, { data: profiles }] = await Promise.all([
    requestsQuery,
    admin
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <AppShell
      titleKey="requests"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    >
      <RequestsClient
        initialRequests={(requests ?? []) as never[]}
        profiles={(profiles ?? []) as never[]}
        currentUserId={user.id}
        currentUserName={profile?.full_name ?? user.email ?? ""}
        role={role}
        initialTab={params.tab ?? "incoming"}
      />
    </AppShell>
  );
}
