import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadStatusValues, normalizeLeadStatus } from "@/lib/crm/customer-core";

const callRoles = new Set(["developer", "admin", "manager", "moderator", "sales"]);

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function dateOrNull(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function deriveConnectionType(lead: {
  lead_type: string | null;
  redirected_date: string | null;
  source: string | null;
  queue_type: string | null;
  owner_id: string | null;
}) {
  if (lead.lead_type === "redirected" || lead.redirected_date) return "redirected";
  if ((lead.source ?? "").toLowerCase().includes("ivr")) return "ivr";
  if (lead.queue_type === "manual") return "manual";
  return lead.owner_id ? "distributed" : "manual";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const role = profile?.role ?? "sales";

    if (!callRoles.has(role)) {
      return NextResponse.json(
        { status: "error", message: "هذه الصلاحية لا تسمح بتشغيل المكالمات." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const outcome = normalizeLeadStatus(String(body.outcome ?? body.status ?? ""));

    if (!leadStatusValues.includes(outcome)) {
      return NextResponse.json(
        { status: "error", message: "نتيجة المكالمة غير صحيحة." },
        { status: 422 }
      );
    }

    const durationMinutes = numberOrNull(body.duration_minutes);
    let nextFollowUp = dateOrNull(body.next_follow_up_at);

    if (outcome === "busy" && !nextFollowUp && durationMinutes) {
      nextFollowUp = new Date(Date.now() + durationMinutes * 60 * 1000);
    }

    if (outcome === "busy" && !nextFollowUp) {
      return NextResponse.json(
        { status: "error", message: "حدد موعد الاتصال القادم عند اختيار مشغول." },
        { status: 422 }
      );
    }

    const admin = createAdminClient();
    const { data: lead, error: leadError } = await admin
      .from("leads")
      .select("id,full_name,owner_id,course_id,program,status,customer_status,assigned_by,intake_by,queue_type,lead_type,redirected_date,source,created_at")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { status: "error", message: "العميل غير موجود." },
        { status: 404 }
      );
    }

    if (role === "sales" && lead.owner_id !== user.id) {
      return NextResponse.json(
        { status: "error", message: "لا يمكنك تحديث عميل غير مسند إليك." },
        { status: 403 }
      );
    }

    const courseId = body.course_id ? String(body.course_id) : null;
    let courseName: string | null = null;

    if (courseId) {
      const { data: course } = await admin
        .from("courses")
        .select("name,name_ar,name_en")
        .eq("id", courseId)
        .maybeSingle();
      courseName = course?.name_ar ?? course?.name ?? course?.name_en ?? null;
    }

    const now = new Date().toISOString();
    const note = String(body.note ?? "").trim() || null;
    const basePatch: Record<string, unknown> = {
      status: outcome,
      customer_status: outcome,
      call_outcome: outcome,
      last_call_at: now,
      last_contact_at: now,
      last_note: note,
      status_updated_at: now,
      next_call_duration_minutes: durationMinutes,
      next_follow_up_at: nextFollowUp ? nextFollowUp.toISOString() : null,
    };

    if (courseId) {
      basePatch.course_id = courseId;
      if (courseName) basePatch.program = courseName;
    }

    if (outcome === "wrong_number") {
      basePatch.lead_type = "rejected";
      basePatch.next_follow_up_at = null;
    }

    if (outcome === "paid") {
      basePatch.registration_status = "registered";
      basePatch.payment_status = "paid";
      basePatch.next_follow_up_at = null;
    }

    const enhancedPatch: Record<string, unknown> = {
      ...basePatch,
      call_sender_id: lead.assigned_by ?? lead.intake_by ?? user.id,
      call_receiver_id: lead.owner_id ?? user.id,
      connection_type: deriveConnectionType(lead),
      system_source: lead.queue_type ?? "manual",
      received_at: lead.created_at ?? now,
      call_done_description: note,
      call_done_at: outcome === "busy" ? null : now,
      call_deadline_at: outcome === "busy" && nextFollowUp ? nextFollowUp.toISOString() : undefined,
    };

    if (enhancedPatch.call_deadline_at === undefined) {
      delete enhancedPatch.call_deadline_at;
    }

    let updateResult = await admin
      .from("leads")
      .update(enhancedPatch)
      .eq("id", id)
      .select("*")
      .single();

    if (updateResult.error) {
      updateResult = await admin
        .from("leads")
        .update(basePatch)
        .eq("id", id)
        .select("*")
        .single();
    }

    const updatedLead = updateResult.data;
    const updateError = updateResult.error;

    if (updateError || !updatedLead) {
      return NextResponse.json(
        { status: "error", message: updateError?.message ?? "تعذر حفظ نتيجة المكالمة." },
        { status: 400 }
      );
    }

    const actorName = profile?.full_name ?? user.email ?? "النظام";

    await admin.from("call_logs").insert({
      lead_id: id,
      actor_id: user.id,
      actor_name: actorName,
      outcome,
      course_id: courseId,
      note,
      next_follow_up_at: nextFollowUp ? nextFollowUp.toISOString() : null,
      duration_minutes: durationMinutes,
    });

    await admin.from("customer_activities").insert({
      lead_id: id,
      actor_id: user.id,
      actor_name: actorName,
      action: "call_processed",
      old_value: lead.customer_status ?? lead.status ?? null,
      new_value: outcome,
      note,
    });

    if (outcome === "busy" && nextFollowUp) {
      await admin.from("tasks").insert({
        title: `متابعة اتصال: ${lead.full_name ?? "عميل"}`,
        status: "pending",
        priority: "high",
        due_date: nextFollowUp.toISOString(),
        owner_id: lead.owner_id ?? user.id,
        related_type: "lead",
        related_id: id,
      });

      const notificationUserId = lead.owner_id ?? user.id;
      await admin.from("notifications").insert({
        user_id: notificationUserId,
        type: "follow_up",
        entity_type: "leads",
        entity_id: id,
        action: "created",
        title: `متابعة اتصال: ${lead.full_name ?? "عميل"}`,
        body: `موعد المتابعة ${nextFollowUp.toLocaleString("ar-SA")}`,
        is_read: false,
      });
    }

    return NextResponse.json({
      status: "success",
      message: "تم حفظ نتيجة المكالمة وتحديث العميل.",
      data: updatedLead,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export const PATCH = POST;
