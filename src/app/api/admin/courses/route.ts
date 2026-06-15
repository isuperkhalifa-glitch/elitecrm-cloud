import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = new Set(["developer", "admin", "manager"]);
const selectColumns = "id,code,name,name_ar,name_en,category,delivery_mode,duration_days,duration_hours,accreditation_number,provider,base_price,sale_price,discount_type,discount_value,discount_code,currency,start_date,end_date,location,description,notes,is_active,sort_order,created_at,updated_at";

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || String(Date.now());
}

function numberOrNull(value: unknown) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function requireCourseManager() {
  const { profile } = await getCurrentUserProfile();
  if (!allowedRoles.has(profile?.role ?? "")) {
    return NextResponse.json({ error: "Courses are available for developer, admin, or manager only." }, { status: 403 });
  }
  return null;
}

function buildPayload(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const code = String(body.code ?? body.id ?? name).trim();
  return {
    id: slugify(String(body.id ?? code ?? name)),
    code: code || null,
    name,
    name_ar: String(body.name_ar ?? name).trim() || name,
    name_en: String(body.name_en ?? name).trim() || name,
    category: String(body.category ?? "").trim() || null,
    delivery_mode: String(body.delivery_mode ?? "online").trim() || "online",
    duration_days: numberOrNull(body.duration_days),
    duration_hours: numberOrNull(body.duration_hours),
    accreditation_number: String(body.accreditation_number ?? "").trim() || null,
    provider: String(body.provider ?? "").trim() || null,
    base_price: numberOrNull(body.base_price) ?? 0,
    sale_price: numberOrNull(body.sale_price),
    discount_type: String(body.discount_type ?? "none").trim() || "none",
    discount_value: numberOrNull(body.discount_value) ?? 0,
    discount_code: String(body.discount_code ?? "").trim() || null,
    currency: String(body.currency ?? "SAR").trim() || "SAR",
    start_date: String(body.start_date ?? "").trim() || null,
    end_date: String(body.end_date ?? "").trim() || null,
    location: String(body.location ?? "").trim() || null,
    description: String(body.description ?? "").trim() || null,
    notes: String(body.notes ?? "").trim() || null,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
    sort_order: numberOrNull(body.sort_order) ?? 0,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const blocked = await requireCourseManager();
    if (blocked) return blocked;
    const body = await request.json();
    const payload = buildPayload(body);
    if (!payload.name) return NextResponse.json({ error: "Course name is required." }, { status: 400 });
    const admin = createAdminClient();
    const { data, error } = await admin.from("courses").upsert(payload, { onConflict: "id" }).select(selectColumns).single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Unable to save course." }, { status: 400 });
    return NextResponse.json({ course: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const blocked = await requireCourseManager();
    if (blocked) return blocked;
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    const payload = buildPayload({ ...body, id });
    const admin = createAdminClient();
    const { data, error } = await admin.from("courses").update(payload).eq("id", id).select(selectColumns).single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Unable to update course." }, { status: 400 });
    return NextResponse.json({ course: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
