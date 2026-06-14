import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const { supabase, user, profile } = await getCurrentUserProfile();

  if (profile?.role !== "admin") {
    return (
      <AppShell
        titleKey="users"
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={profile?.role ?? null}
      >
        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-red-100">
          <h2 className="text-2xl font-black">{"\u063a\u064a\u0631 \u0645\u0633\u0645\u0648\u062d"}</h2>
          <p className="mt-3 text-sm leading-7 text-red-100/80">
            {"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u0623\u062f\u0645\u0646 \u0641\u0642\u0637."}
          </p>
        </div>
      </AppShell>
    );
  }

  const { data: users } = await supabase
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
