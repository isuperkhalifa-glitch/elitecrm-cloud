import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { profile } = await getCurrentUserProfile();
    const role = profile?.role ?? "sales";
    if (!["developer", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const [profiles, companies] = await Promise.all([
      admin
        .from("profiles")
        .select("id,full_name,email,role,is_active")
        .eq("is_active", true)
        .order("full_name"),
      admin
        .from("companies")
        .select("id,name,status")
        .order("name"),
    ]);

    if (profiles.error) return NextResponse.json({ error: profiles.error.message }, { status: 400 });
    if (companies.error) return NextResponse.json({ error: companies.error.message }, { status: 400 });

    return NextResponse.json({
      profiles: profiles.data ?? [],
      companies: (companies.data ?? []).filter((item) => item.status !== "archived"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
