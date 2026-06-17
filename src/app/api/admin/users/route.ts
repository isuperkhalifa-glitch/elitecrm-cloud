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
      blocked: NextResponse.json({ error: "إدارة المستخدمين متاحة للمدير العام أو مطور النظام فقط." }, { status: 403 }),
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
      return NextResponse.json({ error: "الاسم والبريد وكلمة المرور مطلوبة." }, { status: 400 });
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "صلاحية غير صحيحة." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "كلمة المرور لازم تكون 8 أحرف على الأقل." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "تعذر إنشاء المستخدم." }, { status: 400 });
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

    if (!id) return NextResponse.json({ error: "معرف المستخدم مطلوب." }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (typeof body.full_name === "string") patch.full_name = body.full_name.trim();
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;

    if (typeof body.role === "string") {
      if (!allowedRoles.includes(body.role)) return NextResponse.json({ error: "صلاحية غير صحيحة." }, { status: 400 });
      patch.role = body.role;
    }

    if (id === user.id && patch.is_active === false) {
      return NextResponse.json({ error: "لا يمكنك إيقاف حسابك الحالي." }, { status: 400 });
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "لا توجد تغييرات." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select(selectColumns)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "تعذر تحديث المستخدم." }, { status: 400 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
