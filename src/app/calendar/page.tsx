import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarClient } from "./calendar-client";

const allowedRoles = new Set([
  "developer",
  "admin",
  "manager",
  "moderator",
  "sales",
]);

export default async function CalendarPage() {
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;

  if (!allowedRoles.has(role)) {
    return (
      <AppShell
        titleKey="calendar"
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
  const effectiveUserId =
    scope.scopedUserId ?? (role === "sales" ? user.id : null);

  let leadsQuery = admin
    .from("leads")
    .select(
      "id,customer_code,full_name,phone,owner_id,company_id,status,customer_status,program,next_follow_up_at"
    )
    .order("created_at", { ascending: false });

  let tasksQuery = admin
    .from("tasks")
    .select("*")
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  if (effectiveUserId) {
    leadsQuery = leadsQuery.eq("owner_id", effectiveUserId);
    tasksQuery = tasksQuery.eq("owner_id", effectiveUserId);
  }

  if (scope.scopedCompanyId) {
    leadsQuery = leadsQuery.eq("company_id", scope.scopedCompanyId);
  }

  const [
    { data: leads },
    { data: tasks },
    { data: profiles },
  ] = await Promise.all([
    leadsQuery.limit(5000),
    tasksQuery.limit(5000),
    admin
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  const visibleLeads = leads ?? [];
  const visibleLeadIds = new Set(visibleLeads.map((lead) => lead.id));

  const visibleTasks = scope.scopedCompanyId
    ? (tasks ?? []).filter((task: Record<string, unknown>) => {
        const relatedType = String(task.related_type ?? "");
        const relatedId = task.related_id
          ? String(task.related_id)
          : null;

        if (relatedType === "lead" && relatedId) {
          return visibleLeadIds.has(relatedId);
        }

        return (
          relatedType === "company" &&
          relatedId === scope.scopedCompanyId
        );
      })
    : tasks ?? [];

  return (
    <AppShell
      titleKey="calendar"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    >
      <CalendarClient
        leads={visibleLeads as never[]}
        tasks={visibleTasks as never[]}
        profiles={(profiles ?? []) as never[]}
        currentUserId={user.id}
        role={role}
      />
    </AppShell>
  );
}
