import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { normalizePhoneInput, parseLeadStatus } from "@/lib/crm/customer-core";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator", "marketer", "sales"]);
const assignableRoles = new Set(["sales", "manager"]);

function cleanText(value: unknown, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function optionalDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const scope = await getEffectiveScope(profile?.role);
    const role = scope.effectiveRole;

    if (scope.previewAsUser) {
      return NextResponse.json(
        { status: "error", message: "معاينة المستخدم للعرض فقط. ارجع إلى رؤية الأدمن لإضافة عميل." },
        { status: 403 }
      );
    }

    if (!allowedRoles.has(role)) {
      return NextResponse.json(
        { status: "error", message: "هذه الصلاحية لا تسمح بإضافة عميل يدويًا." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const fullName = cleanText(body.full_name, 160);
    const email = cleanText(body.email, 200) || null;
    const source = cleanText(body.source, 120) || "manual_entry";
    const campaignName = cleanText(body.campaign_name, 160) || null;
    const notes = cleanText(body.notes, 3000) || null;
    const status = parseLeadStatus(cleanText(body.status, 50)) ?? "interested";
    const phone = normalizePhoneInput(cleanText(body.country_code, 12), cleanText(body.phone_number, 40));
    const nextFollowUp = optionalDate(body.next_follow_up_at);

    if (!fullName || !phone.phone_number || phone.phone_number.length < 6) {
      return NextResponse.json(
        { status: "error", message: "اسم العميل ورقم الجوال الصحيح مطلوبان." },
        { status: 422 }
      );
    }

    if (nextFollowUp && nextFollowUp.getTime() <= Date.now()) {
      return NextResponse.json(
        { status: "error", message: "موعد المتابعة يجب أن يكون بعد الوقت الحالي." },
        { status: 422 }
      );
    }

    const admin = createAdminClient();
    const requestedCompanyId = cleanText(body.company_id, 80) || null;
    const companyId = scope.scopedCompanyId ?? requestedCompanyId;
    const requestedOwnerId = cleanText(body.owner_id, 80) || null;
    let ownerId = scope.scopedUserId ?? (role === "sales" ? user.id : requestedOwnerId);
    const courseId = cleanText(body.course_id, 120) || null;

    let companyName: string | null = null;
    if (companyId) {
      const { data: company } = await admin
        .from("companies")
        .select("id,name")
        .eq("id", companyId)
        .maybeSingle();

      if (!company) {
        return NextResponse.json(
          { status: "error", message: "مركز التدريب المحدد غير موجود." },
          { status: 422 }
        );
      }
      companyName = company.name;
    }

    let courseName: string | null = null;
    if (courseId) {
      const { data: course } = await admin
        .from("courses")
        .select("id,name,name_ar,name_en,company_id")
        .eq("id", courseId)
        .maybeSingle();

      if (!course) {
        return NextResponse.json(
          { status: "error", message: "الدورة المحددة غير موجودة." },
          { status: 422 }
        );
      }

      if (companyId && course.company_id && course.company_id !== companyId) {
        return NextResponse.json(
          { status: "error", message: "الدورة المحددة لا تتبع مركز التدريب المختار." },
          { status: 422 }
        );
      }

      courseName = course.name_ar ?? course.name ?? course.name_en ?? null;
    }

    if (ownerId) {
      const { data: owner } = await admin
        .from("profiles")
        .select("id,role,is_active")
        .eq("id", ownerId)
        .maybeSingle();

      if (!owner || owner.is_active === false || !assignableRoles.has(owner.role ?? "")) {
        return NextResponse.json(
          { status: "error", message: "موظف المبيعات المحدد غير متاح لاستلام العميل." },
          { status: 422 }
        );
      }
    }

    const { data: duplicateRows } = await admin
      .from("leads")
      .select("id")
      .or(
        `phone.eq.${phone.phone},and(country_code.eq.${phone.country_code},phone_number.eq.${phone.phone_number})`
      )
      .limit(1);

    const duplicate = Boolean(duplicateRows?.length);
    if (duplicate) ownerId = null;

    const now = new Date().toISOString();
    const basePayload: Record<string, unknown> = {
      full_name: fullName,
      phone: phone.phone,
      country_code: phone.country_code,
      phone_number: phone.phone_number,
      email,
      company_id: companyId,
      company_name: companyName,
      source,
      status,
      customer_status: status,
      owner_id: ownerId,
      program: courseName,
      course_id: courseId,
      lead_type: duplicate ? "retargeted" : "fresh",
      registration_status: "not_registered",
      payment_status: "unpaid",
      notes,
      campaign_name: campaignName,
      intake_by: user.id,
      assigned_by: ownerId ? user.id : null,
      assigned_at: ownerId ? now : null,
      next_follow_up_at: nextFollowUp?.toISOString() ?? null,
      status_updated_at: now,
      external_id: `manual:${phone.phone}:${randomUUID()}`,
    };

    const enhancedPayload = {
      ...basePayload,
      entry_source: "manual",
      queue_type: duplicate ? "retargeting" : "manual",
      connection_type: duplicate ? "manual" : ownerId ? "distributed" : "manual",
      operation_status: duplicate ? "pending_operation_dist" : ownerId ? "distributed" : "ready_for_distribution",
      pending_operation_dist: duplicate,
      redirected_date: null,
      workflow_stage: "lead_created",
    };

    let result = await admin.from("leads").insert(enhancedPayload).select("*").single();
    if (result.error) {
      result = await admin.from("leads").insert(basePayload).select("*").single();
    }

    if (result.error || !result.data) {
      return NextResponse.json(
        { status: "error", message: result.error?.message ?? "تعذر إضافة العميل." },
        { status: 400 }
      );
    }

    const actorName = profile?.full_name ?? user.email ?? "النظام";
    await admin.from("customer_activities").insert({
      lead_id: result.data.id,
      actor_id: user.id,
      actor_name: actorName,
      action: "manual_customer_created",
      new_value: status,
      note: duplicate ? "تم إنشاء سجل جديد كإعادة استهداف لرقم موجود مسبقًا." : "تم إنشاء العميل يدويًا.",
    });

    if (ownerId && ownerId !== user.id) {
      await admin.from("notifications").insert({
        user_id: ownerId,
        type: "assignment",
        entity_type: "leads",
        entity_id: result.data.id,
        action: "assigned",
        title: "تم إسناد عميل يدوي جديد إليك",
        body: `تم إسناد العميل ${fullName} إليك بواسطة ${actorName}`,
        is_read: false,
      });
    }

    return NextResponse.json({
      status: "success",
      message: duplicate
        ? "تم إنشاء سجل جديد للعميل كإعادة استهداف ووضعه في انتظار التوزيع."
        : "تم تسجيل العميل اليدوي بنجاح.",
      duplicate,
      data: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
