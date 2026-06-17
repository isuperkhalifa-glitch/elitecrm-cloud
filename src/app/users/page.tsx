import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!["developer", "admin"].includes(profile?.role ?? "")) {
    return (
      <AppShell titleKey="users" userEmail={user.email ?? null} fullName={profile?.full_name ?? null} role={profile?.role ?? null}>
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-100">
          <h2 className="text-2xl font-black">غير مسموح</h2>
          <p className="mt-3 text-sm leading-7 text-red-100/80">إدارة المستخدمين متاحة للمدير العام أو مطور النظام فقط.</p>
        </div>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id,email,full_name,role,is_active,created_at")
    .order("created_at", { ascending: false });

  return (
    <UsersClient
      initialUsers={(users ?? []) as any}
      currentUserId={user.id}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    />
  );
}
