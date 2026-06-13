import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = ["admin", "manager", "moderator", "sales", "finance"];

export async function POST(request: Request) {
  try {
    const { profile } = await getCurrentUserProfile();

    if (!profile || !["admin", "manager"].includes(profile.role ?? "")) {
      return NextResponse.json(
        { error: "غير مسموح بإنشاء مستخدمين." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const role = String(body.role ?? "sales");

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "الاسم والبريد وكلمة المرور مطلوبة." },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "صلاحية غير صحيحة." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور لازم تكون 8 أحرف على الأقل." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "تعذر إنشاء المستخدم." },
        { status: 400 }
      );
    }

    const { data: savedProfile, error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          is_active: true,
        },
        { onConflict: "id" }
      )
      .select("id,email,full_name,role,is_active,created_at")
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: savedProfile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
