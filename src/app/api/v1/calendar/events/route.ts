import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = new Set([
  "developer",
  "admin",
  "manager",
  "moderator",
  "sales",
]);

const managerRoles = new Set([
  "developer",
  "admin",
  "manager",
  "moderator",
]);

const eventTypes = new Set(["call", "meeting", "task"]);
const priorities = new Set(["low", "medium", "high", "urgent"]);

function text(value: unknown) {
  return String(value ?? "").trim();
}

function nullableText(value: unknown) {
  const result = text(value);
  return result || null;
}

function validDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getTask(
  admin: ReturnType<typeof createAdminClient>,
  taskId: string
) {
  const { data } = await admin
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  return data;
}

async function getLead(
  admin: ReturnType<typeof createAdminClient>,
  leadId: string
) {
  const { data } = await admin
    .from("leads")
    .select(
      "id,customer_code,full_name,owner_id,next_follow_up_at,last_note"
    )
    .eq("id", leadId)
    .maybeSingle();

  return data;
}

function canManageOwner(
  role: string,
  currentUserId: string,
  ownerId: string | null
) {
  return managerRoles.has(role) || ownerId === currentUserId;
}

async function notifyOwner(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string | null,
  title: string,
  body: string,
  entityId: string | null
) {
  if (!ownerId) return;

  await admin.from("notifications").insert({
    user_id: ownerId,
    type: "calendar",
    entity_type: "tasks",
    entity_id: entityId,
    action: "calendar_event",
    title,
    body,
    is_read: false,
  });
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const role = profile?.role ?? "sales";

    if (!allowedRoles.has(role)) {
      return NextResponse.json(
        {
          status: "error",
          message: "هذه الصلاحية لا تسمح بإدارة التقويم.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = text(body.action);
    const admin = createAdminClient();

    if (action === "create") {
      const title = text(body.title);
      const eventType = text(body.event_type);
      const dueDate = validDate(body.due_date);
      const requestedOwnerId = nullableText(body.owner_id);
      const ownerId =
        role === "sales"
          ? user.id
          : requestedOwnerId ?? user.id;
      const leadId = nullableText(body.lead_id);

      if (!title || !eventTypes.has(eventType) || !dueDate) {
        return NextResponse.json(
          {
            status: "error",
            message:
              "أكمل عنوان الحدث ونوعه والتاريخ بطريقة صحيحة.",
          },
          { status: 422 }
        );
      }

      if (
        !managerRoles.has(role) &&
        ownerId !== user.id
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: "لا يمكنك إسناد الحدث لمستخدم آخر.",
          },
          { status: 403 }
        );
      }

      if (leadId) {
        const lead = await getLead(admin, leadId);

        if (!lead) {
          return NextResponse.json(
            {
              status: "error",
              message: "العميل المحدد غير موجود.",
            },
            { status: 404 }
          );
        }

        if (
          role === "sales" &&
          lead.owner_id !== user.id
        ) {
          return NextResponse.json(
            {
              status: "error",
              message: "لا يمكنك إنشاء متابعة لعميل غير مسند إليك.",
            },
            { status: 403 }
          );
        }
      }

      const priority = priorities.has(text(body.priority))
        ? text(body.priority)
        : "medium";

      const { data: task, error } = await admin
        .from("tasks")
        .insert({
          title,
          description: nullableText(body.description),
          status: "todo",
          priority,
          due_date: dueDate.toISOString(),
          owner_id: ownerId,
          related_type: leadId ? "lead" : null,
          related_id: leadId,
          event_type: eventType,
          all_day: Boolean(body.all_day),
          created_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error || !task) {
        return NextResponse.json(
          {
            status: "error",
            message:
              error?.message ??
              "تعذر إنشاء الحدث.",
          },
          { status: 400 }
        );
      }

      if (eventType === "call" && leadId) {
        await admin
          .from("leads")
          .update({
            next_follow_up_at: dueDate.toISOString(),
            last_note:
              nullableText(body.description) ??
              "تم إنشاء متابعة من التقويم.",
          })
          .eq("id", leadId);
      }

      await notifyOwner(
        admin,
        ownerId,
        `موعد جديد: ${title}`,
        `موعد الحدث ${dueDate.toLocaleString("ar-SA")}`,
        task.id
      );

      return NextResponse.json({
        status: "success",
        message: "تم إنشاء الحدث بنجاح.",
        data: task,
      });
    }

    if (action === "update") {
      const taskId = text(body.task_id);
      const task = await getTask(admin, taskId);

      if (!task) {
        return NextResponse.json(
          {
            status: "error",
            message: "الحدث غير موجود.",
          },
          { status: 404 }
        );
      }

      if (
        !canManageOwner(
          role,
          user.id,
          task.owner_id ?? null
        )
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: "لا يمكنك تعديل هذا الحدث.",
          },
          { status: 403 }
        );
      }

      const title = text(body.title);
      const eventType = text(body.event_type);
      const dueDate = validDate(body.due_date);
      const requestedOwnerId = nullableText(body.owner_id);
      const ownerId =
        role === "sales"
          ? user.id
          : requestedOwnerId ?? task.owner_id ?? user.id;
      const leadId = nullableText(body.lead_id);

      if (!title || !eventTypes.has(eventType) || !dueDate) {
        return NextResponse.json(
          {
            status: "error",
            message: "بيانات الحدث غير مكتملة.",
          },
          { status: 422 }
        );
      }

      const priority = priorities.has(text(body.priority))
        ? text(body.priority)
        : "medium";

      const { data: updated, error } = await admin
        .from("tasks")
        .update({
          title,
          description: nullableText(body.description),
          priority,
          due_date: dueDate.toISOString(),
          owner_id: ownerId,
          related_type: leadId ? "lead" : null,
          related_id: leadId,
          event_type: eventType,
          all_day: Boolean(body.all_day),
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select("*")
        .single();

      if (error || !updated) {
        return NextResponse.json(
          {
            status: "error",
            message:
              error?.message ??
              "تعذر تحديث الحدث.",
          },
          { status: 400 }
        );
      }

      if (eventType === "call" && leadId) {
        await admin
          .from("leads")
          .update({
            next_follow_up_at: dueDate.toISOString(),
            last_note:
              nullableText(body.description) ??
              "تم تحديث موعد المتابعة من التقويم.",
          })
          .eq("id", leadId);
      }

      await notifyOwner(
        admin,
        ownerId,
        `تم تحديث الموعد: ${title}`,
        `الموعد الجديد ${dueDate.toLocaleString("ar-SA")}`,
        taskId
      );

      return NextResponse.json({
        status: "success",
        message: "تم تحديث الحدث.",
        data: updated,
      });
    }

    if (action === "complete") {
      const taskId = text(body.task_id);
      const task = await getTask(admin, taskId);

      if (!task) {
        return NextResponse.json(
          {
            status: "error",
            message: "الحدث غير موجود.",
          },
          { status: 404 }
        );
      }

      if (
        !canManageOwner(
          role,
          user.id,
          task.owner_id ?? null
        )
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: "لا يمكنك إنهاء هذا الحدث.",
          },
          { status: 403 }
        );
      }

      const completedAt = new Date().toISOString();
      const { data: updated, error } = await admin
        .from("tasks")
        .update({
          status: "done",
          completed_at: completedAt,
          updated_at: completedAt,
        })
        .eq("id", taskId)
        .select("*")
        .single();

      if (error || !updated) {
        return NextResponse.json(
          {
            status: "error",
            message:
              error?.message ??
              "تعذر إنهاء الحدث.",
          },
          { status: 400 }
        );
      }

      if (
        task.event_type === "call" &&
        task.related_type === "lead" &&
        task.related_id
      ) {
        await admin
          .from("leads")
          .update({
            next_follow_up_at: null,
          })
          .eq("id", task.related_id);
      }

      return NextResponse.json({
        status: "success",
        message: "تم إنهاء الحدث.",
        data: updated,
      });
    }

    if (action === "delete") {
      const taskId = text(body.task_id);
      const task = await getTask(admin, taskId);

      if (!task) {
        return NextResponse.json(
          {
            status: "error",
            message: "الحدث غير موجود.",
          },
          { status: 404 }
        );
      }

      if (
        !canManageOwner(
          role,
          user.id,
          task.owner_id ?? null
        )
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: "لا يمكنك حذف هذا الحدث.",
          },
          { status: 403 }
        );
      }

      const { error } = await admin
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        return NextResponse.json(
          {
            status: "error",
            message: error.message,
          },
          { status: 400 }
        );
      }

      if (
        task.event_type === "call" &&
        task.related_type === "lead" &&
        task.related_id
      ) {
        await admin
          .from("leads")
          .update({
            next_follow_up_at: null,
          })
          .eq("id", task.related_id);
      }

      return NextResponse.json({
        status: "success",
        message: "تم حذف الحدث.",
      });
    }

    if (
      action === "update_follow_up" ||
      action === "complete_follow_up"
    ) {
      const leadId = text(body.lead_id);
      const lead = await getLead(admin, leadId);

      if (!lead) {
        return NextResponse.json(
          {
            status: "error",
            message: "العميل غير موجود.",
          },
          { status: 404 }
        );
      }

      if (
        role === "sales" &&
        lead.owner_id !== user.id
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: "لا يمكنك تعديل متابعة هذا العميل.",
          },
          { status: 403 }
        );
      }

      const dueDate =
        action === "complete_follow_up"
          ? null
          : validDate(body.due_date);

      if (
        action === "update_follow_up" &&
        !dueDate
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: "حدد موعد متابعة صحيح.",
          },
          { status: 422 }
        );
      }

      const note =
        nullableText(body.description) ??
        nullableText(body.note);

      const { data: updated, error } = await admin
        .from("leads")
        .update({
          next_follow_up_at:
            dueDate?.toISOString() ?? null,
          last_note:
            note ??
            (action === "complete_follow_up"
              ? "تم إنهاء المتابعة من التقويم."
              : "تم تحديث المتابعة من التقويم."),
        })
        .eq("id", leadId)
        .select(
          "id,customer_code,full_name,phone,owner_id,status,customer_status,program,next_follow_up_at,last_note"
        )
        .single();

      if (error || !updated) {
        return NextResponse.json(
          {
            status: "error",
            message:
              error?.message ??
              "تعذر تحديث المتابعة.",
          },
          { status: 400 }
        );
      }

      await admin.from("customer_activities").insert({
        lead_id: leadId,
        actor_id: user.id,
        actor_name:
          profile?.full_name ??
          user.email ??
          "النظام",
        action:
          action === "complete_follow_up"
            ? "follow_up_completed"
            : "follow_up_rescheduled",
        old_value: lead.next_follow_up_at,
        new_value:
          dueDate?.toISOString() ?? null,
        note,
      });

      return NextResponse.json({
        status: "success",
        message:
          action === "complete_follow_up"
            ? "تم إنهاء المتابعة."
            : "تم تحديث موعد المتابعة.",
        data: updated,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: "الإجراء غير معروف.",
      },
      { status: 422 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error";

    return NextResponse.json(
      {
        status: "error",
        message,
      },
      { status: 500 }
    );
  }
}
