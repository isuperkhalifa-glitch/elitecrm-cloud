import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { mergeSystemSettings } from "@/lib/settings/defaults";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomizerClient } from "./customizer-client";

export default async function CustomizePage({ searchParams }: any) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const pageKey = typeof resolvedSearchParams?.page === "string" ? resolvedSearchParams.page : "customers";
  const { user, profile } = await getCurrentUserProfile();

  if (!["developer", "admin"].includes(profile?.role ?? "")) {
    return (
      <AppShell titleKey="customize" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-700">هذه الصفحة متاحة للمطور أو الأدمن فقط.</div>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("system_settings")
    .select("*")
    .order("group_name", { ascending: true })
    .order("key", { ascending: true });

  return (
    <AppShell titleKey="customize" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
      <CustomizerClient
        pageKey={pageKey}
        initialSettings={mergeSystemSettings((settings ?? []) as any) as any}
      />
    </AppShell>
  );
}
