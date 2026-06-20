import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { CallsWorkspaceClient } from "./calls-workspace-client";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator", "sales"]);

const enhancedFields = [
  "id",
  "customer_code",
  "full_name",
  "phone",
  "country_code",
  "phone_number",
  "owner_id",
  "status",
  "customer_status",
  "lead_type",
  "source",
  "program",
  "course_id",
  "priority",
  "next_follow_up_at",
  "last_contact_at",
  "last_call_at",
  "last_note",
  "created_at",
  "assigned_by",
  "intake_by",
  "queue_type",
  "redirected_date",
  "call_sender_id",
  "call_receiver_id",
  "connection_type",
  "caller_mobile",
  "second_number",
  "system_source",
  "received_at",
  "call_deadline_at",
  "call_done_at",
  "call_done_description",
  "education_level",
  "city",
].join(",");

const fallbackFields = [
  "id",
  "customer_code",
  "full_name",
  "phone",
  "country_code",
  "phone_number",
  "owner_id",
  "status",
  "customer_status",
  "lead_type",
  "source",
  "program",
  "course_id",
  "priority",
  "next_follow_up_at",
  "last_contact_at",
  "last_call_at",
  "last_note",
  "created_at",
  "assigned_by",
  "intake_by",
  "queue_type",
  "redirected_date",
].join(",");

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

    if (role === "sales") {
      query = query.eq("owner_id", user.id);
    }

    return query;
  }

  let { data: leads, error: leadsError } = await createLeadQuery(enhancedFields);
  let enhancedSchemaReady = true;

  if (leadsError) {
    enhancedSchemaReady = false;
    const fallback = await createLeadQuery(fallbackFields);
    leads = fallback.data;
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
      <CallsWorkspaceClient
        initialLeads={(leads ?? []) as never[]}
        courses={(courses ?? []) as never[]}
        profiles={(profiles ?? []) as never[]}
        currentUserId={user.id}
        role={role}
        initialFilter={params.filter ?? "all"}
        enhancedSchemaReady={enhancedSchemaReady}
      />
    </AppShell>
  );
}
