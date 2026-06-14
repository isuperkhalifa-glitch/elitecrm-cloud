import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const selectColumns = "key,label,group_name,value,description,is_public,updated_at";

async function requireAdmin() {
  const { profile } = await getCurrentUserProfile();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "إعدادات النظام متاحة للأدمن فقط." },
      { status: 403 }
    );
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const blocked = await requireAdmin();
    if (blocked) return blocked;

    const body = await request.json();
    const key = String(body.key ?? "").trim();
    const label = String(body.label ?? "").trim();
    const groupName = String(body.group_name ?? "general").trim() || "general";
    const description = body.description == null ? null : String(body.description);
    const value = body.value ?? null;
    const isPublic = Boolean(body.is_public ?? true);

    if (!key || !label) {
      return NextResponse.json(
        { error: "مفتاح الإعداد واسمه مطلوبان." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("system_settings")
      .upsert(
        {
          key,
          label,
          group_name: groupName,
          value,
          description,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select(selectColumns)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "تعذر حفظ الإعداد." },
        { status: 400 }
      );
    }

    return NextResponse.json({ setting: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const blocked = await requireAdmin();
    if (blocked) return blocked;

    const { searchParams } = new URL(request.url);
    const key = String(searchParams.get("key") ?? "").trim();

    if (!key) {
      return NextResponse.json(
        { error: "مفتاح الإعداد مطلوب." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("system_settings").delete().eq("key", key);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
