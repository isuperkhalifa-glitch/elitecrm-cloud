import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const createRoles = new Set([
  "developer",
  "admin",
  "manager",
  "moderator",
  "marketer",
  "sales",
  "finance",
]);

const requestTypes = new Set([
  "complete_documents",
  "registration",
  "meeting",
  "call",
  "follow_up",
  "other",
]);

const priorities = new Set(["low", "medium", "high", "urgent"]);

function makeRequestCode() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100);
  return `REQ-${date}-${time}${random}`;
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const role = profile?.role ?? "sales";

    if (!createRoles.has(role)) {
      return NextResponse.json(
        { status: "error", message: "هذه الصلاحية لا تسمح بإسناد الطلبات." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const receiverId = String(body.receiver_id ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const requestType = String(body.request_type ?? "other").trim();
    const priority = String(body.priority ?? "medium").trim();
    const dueDate = new Date(String(body.due_date ?? ""));

    if (!receiverId || !title || !description) {
      return NextResponse.json(
        { status: "error", message: "المستلم والعنوان والوصف حقول مطلوبة." },
        { status: 422 }
      );
    }

    if (!requestTypes.has(requestType) || !priorities.has(priority)) {
      return NextResponse.json(
        { status: "error", message: "نوع الطلب أو الأولوية غير صحيحة." },
        { status: 422 }
      );
    }

    if (Number.isNaN(dueDate.getTime()) || dueDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { status: "error", message: "موعد التسليم يجب أن يكون بعد الوقت الحالي." },
        { status: 422 }
      );
    }

    const admin = createAdminClient();
    const { data: receiver } = await admin
      .from("profiles")
      .select("id,full_name,email,is_active")
      .eq("id", receiverId)
      .eq("is_active", true)
      .maybeSingle();

    if (!receiver) {
      return NextResponse.json(
        { status: "error", message: "المستخدم المستلم غير موجود أو غير نشط." },
        { status: 404 }
      );
    }

    const eventType = requestType === "meeting"
      ? "meeting"
      : requestType === "call"
        ? "call"
        : "task";

    const payload = {
      request_code: makeRequestCode(),
      title,
      description,
      request_type: requestType,
      priority,
      status: "todo",
      due_date: dueDate.toISOString(),
      sender_id: user.id,
      receiver_id: receiverId,
      owner_id: receiverId,
      created_by: user.id,
      event_type: eventType,
      related_type: "internal_request",
    };

    const { data: task, error } = await admin
      .from("tasks")
      .insert(payload)
      .select("id,request_code,title,description,request_type,priority,status,due_date,sender_id,receiver_id,owner_id,event_type,result_type,started_at,done_at,done_description,created_at,updated_at")
      .single();

    if (error || !task) {
      return NextResponse.json(
        { status: "error", message: error?.message ?? "تعذر إنشاء الطلب." },
        { status: 400 }
      );
    }

    const actorName = profile?.full_name ?? user.email ?? "النظام";

    await Promise.all([
      admin.from("request_activity_logs").insert({
        task_id: task.id,
        actor_id: user.id,
        actor_name: actorName,
        action: "created",
        new_status: "todo",
        note: description,
      }),
      admin.from("notifications").insert({
        user_id: receiverId,
        type: "internal_request",
        entity_type: "tasks",
        entity_id: task.id,
        action: "assigned",
        title: `طلب جديد: ${title}`,
        body: `تم إسناد طلب إليك بواسطة ${actorName}`,
        is_read: false,
      }),
    ]);

    return NextResponse.json({
      status: "success",
      message: "تم إسناد الطلب وإضافته إلى التقويم.",
      data: task,
      receiver,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
