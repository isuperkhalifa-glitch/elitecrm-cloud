import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];
const selectColumns = "id,email,full_name,role,is_active,created_at";

async function requireAdmin() {
  const { user, profile } = await getCurrentUserProfile();
  if (!["developer", "admin"].includes(profile?.role ?? "")) {
    return {
      user,
      blocked: NextResponse.json({ error: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ظ…طھط§ط­ط© ظ„ظ„ظ…ط¯ظٹط± ط§ظ„ط¹ط§ظ… ط£ظˆ ظ…ط·ظˆط± ط§ظ„ظ†ط¸ط§ظ… ظپظ‚ط·." }, { status: 403 }),
    };
  }
  return { user, blocked: null };
}

export async function GET() {
  try {
    const { blocked } = await requireAdmin();
    if (blocked) return blocked;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select(selectColumns)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { blocked } = await requireAdmin();
    if (blocked) return blocked;

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const role = String(body.role ?? "sales");

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "ط§ظ„ط§ط³ظ… ظˆط§ظ„ط¨ط±ظٹط¯ ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ…ط·ظ„ظˆط¨ط©." }, { status: 400 });
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "طµظ„ط§ط­ظٹط© ط؛ظٹط± طµط­ظٹط­ط©." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ„ط§ط²ظ… طھظƒظˆظ† 8 ط£ط­ط±ظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط³طھط®ط¯ظ…." }, { status: 400 });
    }

    const { data: savedProfile, error: profileError } = await admin
      .from("profiles")
      .upsert({ id: data.user.id, email, full_name: fullName, role, is_active: true }, { onConflict: "id" })
      .select(selectColumns)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ user: savedProfile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, blocked } = await requireAdmin();
    if (blocked) return blocked;

    const body = await request.json();
    const id = String(body.id ?? "").trim();

    if (!id) return NextResponse.json({ error: "ظ…ط¹ط±ظپ ط§ظ„ظ…ط³طھط®ط¯ظ… ظ…ط·ظ„ظˆط¨." }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (typeof body.full_name === "string") patch.full_name = body.full_name.trim();
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

    if (typeof body.role === "string") {
      if (!allowedRoles.includes(body.role)) return NextResponse.json({ error: "طµظ„ط§ط­ظٹط© ط؛ظٹط± طµط­ظٹط­ط©." }, { status: 400 });
      patch.role = body.role;
    }

    if (id === user.id && patch.is_active === false) {
      return NextResponse.json({ error: "ظ„ط§ ظٹظ…ظƒظ†ظƒ ط¥ظٹظ‚ط§ظپ ط­ط³ط§ط¨ظƒ ط§ظ„ط­ط§ظ„ظٹ." }, { status: 400 });
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "ظ„ط§ طھظˆط¬ط¯ طھط؛ظٹظٹط±ط§طھ." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select(selectColumns)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ظ…ط³طھط®ط¯ظ…." }, { status: 400 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
