import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requireAdmin } from "@/lib/auth/server-guards";
import { mergeSystemSettings } from "@/lib/settings/defaults";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({ searchParams }: any) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedPageKey = typeof resolvedSearchParams?.page === "string" ? resolvedSearchParams.page : null;
  const { user, profile } = await getCurrentUserProfile();

  if (!["developer", "admin"].includes(profile?.role ?? "")) {
    return (
      <AppShell titleKey="settings" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-700">هذه الصفحة متاحة للمطور أو الأدمن فقط.</div>
      </AppShell>
    );
  }

  requireAdmin(profile?.role);
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("system_settings")
    .select("*")
    .order("group_name", { ascending: true })
    .order("key", { ascending: true });

  return (
    <SettingsClient
      initialSettings={mergeSystemSettings((settings ?? []) as any) as any}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
      pageKey={selectedPageKey}
    />
  );
}
