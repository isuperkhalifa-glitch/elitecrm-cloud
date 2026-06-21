import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const validRoles = new Set([
  "developer",
  "admin",
  "manager",
  "moderator",
  "marketer",
  "sales",
  "finance",
  "data_analyst",
]);

export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  const invalidProfile =
    profileError ||
    !profile ||
    profile.is_active === false ||
    !validRoles.has(String(profile.role ?? ""));

  if (invalidProfile) {
    await supabase.auth.signOut();
    redirect("/login?error=account_not_configured");
  }

  return {
    supabase,
    user,
    profile,
    realUser: user,
    realProfile: profile,
  };
}
