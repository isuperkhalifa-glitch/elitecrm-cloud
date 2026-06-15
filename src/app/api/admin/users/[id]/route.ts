import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { isAdmin, isRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = {
  params: Promise<{ id: string }> | { id: string };
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { user, profile } = await getCurrentUserProfile();

    if (!isAdmin(profile?.role)) {
      return NextResponse.json(
        { error: "هذه الصلاحية للأدمن فقط." },
        { status: 403 }
      );
    }

    const params = await context.params;
    const userId = String(params.id ?? "").trim();

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (typeof body.full_name === "string") {
      patch.full_name = body.full_name.trim();
    }

    if (typeof body.role === "string") {
      if (!isRole(body.role)) {
        return NextResponse.json(
          { error: "صلاحية غير صحيحة." },
          { status: 400 }
        );
      }
      patch.role = body.role;
    }

    if (typeof body.is_active === "boolean") {
      if (userId === user.id && body.is_active === false) {
        return NextResponse.json(
          { error: "لا يمكنك إيقاف حسابك الحالي." },
          { status: 400 }
        );
      }
      patch.is_active = body.is_active;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "لا توجد تعديلات صالحة." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select("id,email,full_name,role,is_active,created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "تعذر تحديث المستخدم." },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
