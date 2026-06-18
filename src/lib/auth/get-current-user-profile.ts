import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ScopeCookie = {
  mode?: string;
  targetId?: string;
};

const adminPreviewRoles = new Set(["developer", "admin", "manager"]);

async function readScopeCookie(): Promise<ScopeCookie | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("elitecrm-scope")?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as ScopeCookie;
  } catch {
    return null;
  }
}

export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", user.id)
    .single();

  if (profile?.is_active === false) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const scope = await readScopeCookie();
  const canPreviewUser = adminPreviewRoles.has(profile?.role ?? "");

  if (canPreviewUser && scope?.mode === "user" && scope.targetId && scope.targetId !== user.id) {
    const admin = createAdminClient();
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("id,email,full_name,role,is_active")
      .eq("id", scope.targetId)
      .eq("is_active", true)
      .single();

    if (targetProfile) {
      return {
        supabase,
        user: {
          ...user,
          id: targetProfile.id,
          email: targetProfile.email ?? user.email,
        } as typeof user,
        profile: targetProfile,
        realUser: user,
        realProfile: profile,
      };
    }
  }

  return {
    supabase,
    user,
    profile,
    realUser: user,
    realProfile: profile,
  };
}
