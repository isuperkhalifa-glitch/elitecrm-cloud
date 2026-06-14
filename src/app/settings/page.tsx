import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { SettingsClient } from "./settings-client";
import { mergeSystemSettings } from "@/lib/settings/defaults";

export default async function SettingsPage({ searchParams }: any) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedPageKey =
    typeof resolvedSearchParams?.page === "string"
      ? resolvedSearchParams.page
      : null;

  const { supabase, user, profile } = await getCurrentUserProfile();

  const canEdit = profile?.role === "admin";

  if (!canEdit) {
    return (
      <AppShell
        titleKey="settings"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      >
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-200">
          هذه الصفحة متاحة للأدمن فقط.
        </div>
      </AppShell>
    );
  }

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

