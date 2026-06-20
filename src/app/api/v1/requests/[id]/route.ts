import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const managers = new Set(["developer", "admin", "manager"]);
const editors = new Set(["developer", "admin", "manager", "moderator", "marketer", "sales", "finance"]);
const resultTypes = new Set(["completed", "rejected", "needs_information", "forwarded"]);

const selectFields = "id,request_code,title,description,request_type,priority,status,due_date,sender_id,receiver_id,owner_id,event_type,result_type,started_at,done_at,done_description,created_at,updated_at";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const { id } = await context.params;
    const admin = createAdminClient();
    const { data: task } = await admin.from("tasks").select(selectFields).eq("id", id).maybeSingle();

    if (!task) return NextResponse.json({ status: "error", message: "Request not found" }, { status: 404 });

    const role = profile?.role ?? "sales";
    if (!managers.has(role) && task.sender_id !== user.id && task.receiver_id !== user.id) {
      return NextResponse.json({ status: "error", message: "Not allowed" }, { status: 403 });
    }

    const { data: logs } = await admin
      .from("request_activity_logs")
      .select("id,actor_id,actor_name,action,old_status,new_status,note,created_at")
      .eq("task_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ status: "success", data: task, logs: logs ?? [] });
  } catch (error) {
    return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const role = profile?.role ?? "sales";
    if (!editors.has(role)) return NextResponse.json({ status: "error", message: "Read only" }, { status: 403 });

    const { id } = await context.params;
    const body = await request.json();
    const action = String(body.action ?? "");
    const admin = createAdminClient();
    const { data: task } = await admin.from("tasks").select(selectFields).eq("id", id).maybeSingle();

    if (!task) return NextResponse.json({ status: "error", message: "Request not found" }, { status: 404 });

    const isManager = managers.has(role);
    const isSender = task.sender_id === user.id;
    const isReceiver = task.receiver_id === user.id;
    if (!isManager && !isSender && !isReceiver) {
      return NextResponse.json({ status: "error", message: "Not allowed" }, { status: 403 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let note = String(body.note ?? "").trim() || null;
    let notifyUserId: string | null = null;

    if (action === "start") {
      if (!isManager && !isReceiver) return NextResponse.json({ status: "error", message: "Receiver only" }, { status: 403 });
      patch.status = "in_progress";
      patch.started_at = new Date().toISOString();
      notifyUserId = task.sender_id;
    } else if (action === "complete") {
      if (!isManager && !isReceiver) return NextResponse.json({ status: "error", message: "Receiver only" }, { status: 403 });
      const resultType = String(body.result_type ?? "completed");
      const description = String(body.done_description ?? "").trim();
      if (!resultTypes.has(resultType) || !description) {
        return NextResponse.json({ status: "error", message: "Result and description are required" }, { status: 422 });
      }
      const now = new Date().toISOString();
      patch.status = "done";
      patch.result_type = resultType;
      patch.done_description = description;
      patch.done_at = now;
      patch.completed_at = now;
      note = description;
      notifyUserId = task.sender_id;
    } else if (action === "cancel") {
      if (!isManager && !isSender) return NextResponse.json({ status: "error", message: "Sender only" }, { status: 403 });
      patch.status = "canceled";
      notifyUserId = task.receiver_id;
    } else if (action === "reopen") {
      if (!isManager && !isSender) return NextResponse.json({ status: "error", message: "Sender only" }, { status: 403 });
      patch.status = "todo";
      patch.result_type = null;
      patch.done_description = null;
      patch.done_at = null;
      patch.completed_at = null;
      notifyUserId = task.receiver_id;
    } else {
      return NextResponse.json({ status: "error", message: "Unknown action" }, { status: 422 });
    }

    const { data: updated, error } = await admin.from("tasks").update(patch).eq("id", id).select(selectFields).single();
    if (error || !updated) return NextResponse.json({ status: "error", message: error?.message ?? "Update failed" }, { status: 400 });

    const actorName = profile?.full_name ?? user.email ?? "System";
    await admin.from("request_activity_logs").insert({
      task_id: id,
      actor_id: user.id,
      actor_name: actorName,
      action,
      old_status: task.status,
      new_status: updated.status,
      note,
    });

    if (notifyUserId && notifyUserId !== user.id) {
      await admin.from("notifications").insert({
        user_id: notifyUserId,
        type: "internal_request",
        entity_type: "tasks",
        entity_id: id,
        action,
        title: `Request updated: ${updated.title}`,
        body: `Updated by ${actorName}`,
        is_read: false,
      });
    }

    return NextResponse.json({ status: "success", message: "Request updated", data: updated });
  } catch (error) {
    return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
