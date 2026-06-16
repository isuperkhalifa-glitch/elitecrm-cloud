import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = ["developer", "admin", "manager", "moderator", "sales", "finance", "marketer"];
const selectColumns = "id,email,full_name,role,is_active,created_at";

async function requireAdmin() {
  const { user, profile } = await getCurrentUserProfile();

  if (!["developer", "admin"].includes(profile?.role ?? "")) {
    return {
      user,
      blocked: NextResponse.json(
        { error: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u0623\u062f\u0645\u0646 \u0641\u0642\u0637." },
        { status: 403 }
      ),
    };
  }

  return { user, blocked: null };
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
      return NextResponse.json(
        { error: "\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0628\u0631\u064a\u062f \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0629." },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "\u0635\u0644\u0627\u062d\u064a\u0629 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0627\u0632\u0645 \u062a\u0643\u0648\u0646 8 \u0623\u062d\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645." },
        { status: 400 }
      );
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

    if (!id) {
      return NextResponse.json({ error: "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0645\u0637\u0644\u0648\u0628." }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};

    if (typeof body.full_name === "string") patch.full_name = body.full_name.trim();
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

    if (typeof body.role === "string") {
      if (!allowedRoles.includes(body.role)) {
        return NextResponse.json({ error: "\u0635\u0644\u0627\u062d\u064a\u0629 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629." }, { status: 400 });
      }
      patch.role = body.role;
    }

    if (id === user.id && patch.is_active === false) {
      return NextResponse.json(
        { error: "\u0644\u0627 \u064a\u0645\u0643\u0646\u0643 \u0625\u064a\u0642\u0627\u0641 \u062d\u0633\u0627\u0628\u0643 \u0627\u0644\u062d\u0627\u0644\u064a." },
        { status: 400 }
      );
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u063a\u064a\u064a\u0631\u0627\u062a." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select(selectColumns)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645." },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
