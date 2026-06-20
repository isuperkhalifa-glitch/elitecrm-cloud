import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { parseLeadStatus } from "@/lib/crm/customer-core";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator", "sales"]);
const openTaskStatuses = ["todo", "pending", "in_progress"];

function positiveMinutes(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= 1440
    ? Math.round(number)
    : null;
}

function validDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function connectionType(lead: Record<string, unknown>) {
  if (lead.lead_type === "redirected" || lead.redirected_date) return "redirected";
  if (String(lead.source ?? "").toLowerCase().includes("ivr")) return "ivr";
  if (lead.queue_type === "manual") return "manual";
  return lead.owner_id ? "distributed" : "manual";
}

export async function processCall(request: Request, id: string) {
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;

  if (!allowedRoles.has(role)) {
    return NextResponse.json(
      { status: "error", message: "هذه الصلاحية لا تسمح بتشغيل المكالمات." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const outcome = parseLeadStatus(String(body.outcome ?? body.status ?? ""));
  if (!outcome) {
    return NextResponse.json(
      { status: "error", message: "نتيجة المكالمة غير صحيحة." },
      { status: 422 }
    );
  }

  const durationMinutes = positiveMinutes(body.duration_minutes);
  let nextFollowUp = validDate(body.next_follow_up_at);
  if (outcome === "busy" && !nextFollowUp && durationMinutes) {
    nextFollowUp = new Date(Date.now() + durationMinutes * 60 * 1000);
  }
  if (outcome === "busy" && (!nextFollowUp || nextFollowUp.getTime() <= Date.now())) {
    return NextResponse.json(
      { status: "error", message: "حدد موعد اتصال قادم بعد الوقت الحالي." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("id,full_name,owner_id,company_id,course_id,status,customer_status,assigned_by,intake_by,queue_type,lead_type,redirected_date,source,created_at")
    .eq("id", id)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ status: "error", message: "العميل غير موجود." }, { status: 404 });
  }
  if (scope.scopedUserId && lead.owner_id !== scope.scopedUserId) {
    return NextResponse.json({ status: "error", message: "العميل خارج نطاق المستخدم المحدد." }, { status: 403 });
  }
  if (scope.scopedCompanyId && lead.company_id !== scope.scopedCompanyId) {
    return NextResponse.json({ status: "error", message: "العميل خارج نطاق مركز التدريب المحدد." }, { status: 403 });
  }
  if (!scope.scopedUserId && role === "sales" && lead.owner_id !== user.id) {
    return NextResponse.json({ status: "error", message: "لا يمكنك تحديث عميل غير مسند إليك." }, { status: 403 });
  }

  const courseId = body.course_id ? String(body.course_id) : null;
  let courseName: string | null = null;
  if (courseId) {
    const { data: course } = await admin
      .from("courses")
      .select("id,name,name_ar,name_en,company_id")
      .eq("id", courseId)
      .maybeSingle();
    if (!course) {
      return NextResponse.json({ status: "error", message: "الدورة المحددة غير موجودة." }, { status: 422 });
    }
    if (lead.company_id && course.company_id && lead.company_id !== course.company_id) {
      return NextResponse.json({ status: "error", message: "الدورة لا تتبع مركز تدريب العميل." }, { status: 422 });
    }
    courseName = course.name_ar ?? course.name ?? course.name_en ?? null;
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
    next_follow_up_at: nextFollowUp?.toISOString() ?? null,
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
    connection_type: connectionType(lead),
    system_source: lead.queue_type ?? "manual",
    received_at: lead.created_at ?? now,
    call_done_description: note,
    call_done_at: outcome === "busy" ? null : now,
    call_deadline_at: outcome === "busy" ? nextFollowUp?.toISOString() ?? null : null,
  };

  let result = await admin.from("leads").update(enhancedPatch).eq("id", id).select("*").single();
  if (result.error) {
    result = await admin.from("leads").update(basePatch).eq("id", id).select("*").single();
  }
  if (result.error || !result.data) {
    return NextResponse.json(
      { status: "error", message: result.error?.message ?? "تعذر حفظ نتيجة المكالمة." },
      { status: 400 }
    );
  }

  const actorName = profile?.full_name ?? user.email ?? "النظام";
  await Promise.all([
    admin.from("call_logs").insert({
      lead_id: id,
      actor_id: user.id,
      actor_name: actorName,
      outcome,
      course_id: courseId,
      note,
      next_follow_up_at: nextFollowUp?.toISOString() ?? null,
      duration_minutes: durationMinutes,
    }),
    admin.from("customer_activities").insert({
      lead_id: id,
      actor_id: user.id,
      actor_name: actorName,
      action: "call_processed",
      old_value: lead.customer_status ?? lead.status ?? null,
      new_value: outcome,
      note,
    }),
  ]);

  const ownerId = lead.owner_id ?? scope.scopedUserId ?? user.id;
  const { data: openTasks } = await admin
    .from("tasks")
    .select("id")
    .eq("related_type", "lead")
    .eq("related_id", id)
    .eq("event_type", "call")
    .in("status", openTaskStatuses)
    .order("created_at", { ascending: false });

  if (outcome === "busy" && nextFollowUp) {
    const taskPayload = {
      title: `متابعة اتصال: ${lead.full_name ?? "عميل"}`,
      status: "todo",
      priority: "high",
      due_date: nextFollowUp.toISOString(),
      owner_id: ownerId,
      related_type: "lead",
      related_id: id,
      event_type: "call",
      updated_at: now,
    };
    const currentTask = openTasks?.[0];
    if (currentTask) {
      await admin.from("tasks").update(taskPayload).eq("id", currentTask.id);
      const duplicateIds = (openTasks ?? []).slice(1).map((item) => item.id);
      if (duplicateIds.length) {
        await admin.from("tasks").update({ status: "canceled", updated_at: now }).in("id", duplicateIds);
      }
    } else {
      await admin.from("tasks").insert({ ...taskPayload, created_by: user.id });
    }
    await admin.from("notifications").insert({
      user_id: ownerId,
      type: "follow_up",
      entity_type: "leads",
      entity_id: id,
      action: "created",
      title: `متابعة اتصال: ${lead.full_name ?? "عميل"}`,
      body: `موعد المتابعة ${nextFollowUp.toLocaleString("ar-SA")}`,
      is_read: false,
    });
  } else if (openTasks?.length) {
    await admin
      .from("tasks")
      .update({ status: "done", completed_at: now, updated_at: now })
      .in("id", openTasks.map((item) => item.id));
  }

  return NextResponse.json({
    status: "success",
    message: "تم حفظ نتيجة المكالمة وتحديث العميل.",
    data: result.data,
  });
}
