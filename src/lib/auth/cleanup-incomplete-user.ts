import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function cleanupIncompleteUser(admin: AdminClient, userId: string) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error?.message ?? null;
}
