import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requireAdmin } from "@/lib/auth/server-guards";
import { mergeSystemSettings } from "@/lib/settings/defaults";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({ searchParams }: any) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedPageKey =
    typeof resolvedSearchParams?.page === "string"
      ? resolvedSearchParams.page
      : null;

  const { supabase, user, profile } = await getCurrentUserProfile();

  if (!["developer", "admin"].includes(profile?.role ?? "")) {
    return (
      <AppShell
        titleKey="settings"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      >
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
          هذه الصفحة متاحة للمطور أو الأدمن فقط.
        </div>
      </AppShell>
    );
  }

  requireAdmin(profile?.role);

  const { data: settings } = await supabase
    .from("system_settings")
    .select("key,label,group_name,value,description,is_public,updated_at")
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
