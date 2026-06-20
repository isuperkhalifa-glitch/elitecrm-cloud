import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { getEffectiveYear } from "@/lib/filters/effective-year";
import { ReportsClient } from "./reports-client";
import type { ReportTab } from "./reports-types";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}) {
  const resolved = searchParams ? await searchParams : {};
  const { user, profile } = await getCurrentUserProfile();
  const selectedYear = await getEffectiveYear();
  requirePageAccess(profile?.role, "reports");

  const initialTab: ReportTab =
    resolved.tab === "distribution" || resolved.tab === "tasks" ? resolved.tab : "sources";

  return (
    <AppShell
      titleKey="reports"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    >
      <ReportsClient key={selectedYear} initialTab={initialTab} selectedYear={selectedYear} />
    </AppShell>
  );
}
