import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = new Set(["developer", "admin", "manager", "finance", "data_analyst"]);
const completedStatuses = new Set(["done", "completed", "closed", "finished"]);

function validDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function dateValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  return null;
}

function inRange(date: Date | null, from: Date, to: Date) {
  return Boolean(date && date >= from && date <= to);
}

function inferConnection(row: Record<string, unknown>) {
  const direct = text(row.connection_type);
  if (direct) return direct;
  if (text(row.lead_type) === "redirected" || row.redirected_date) return "redirected";
  if (text(row.source).toLowerCase().includes("ivr")) return "ivr";
  if (text(row.queue_type) === "manual") return "manual";
  return row.owner_id ? "distributed" : "manual";
}

function inferLeadType(row: Record<string, unknown>) {
  const direct = text(row.lead_type);
  if (["fresh", "retargeted", "redirected"].includes(direct)) return direct;
  if (inferConnection(row) === "redirected") return "redirected";
  return "fresh";
}

function profileName(profileMap: Map<string, string>, id: unknown) {
  return typeof id === "string" && id ? profileMap.get(id) ?? id : "غير محدد";
}

export async function GET(request: Request) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const role = profile?.role ?? "sales";
    if (!allowedRoles.has(role)) {
      return NextResponse.json({ status: "error", message: "لا تملك صلاحية عرض التقارير." }, { status: 403 });
    }

    const url = new URL(request.url);
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    const from = startOfDay(validDate(url.searchParams.get("from"), defaultFrom));
    const to = endOfDay(validDate(url.searchParams.get("to"), now));
    const connection = url.searchParams.get("connection") ?? "";
    const dataType = url.searchParams.get("dataType") === "new" ? "new" : "all";

    const admin = createAdminClient();
    const profilesResult = await admin
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .order("full_name");

    const profileRows = (profilesResult.data ?? []) as Record<string, unknown>[];
    const profileMap = new Map(
      profileRows.map((item) => [
        text(item.id),
        text(item.full_name) || text(item.email) || text(item.id),
      ])
    );

    let leadsResult = await admin
      .from("leads")
      .select("id,source,owner_id,created_at,assigned_at,lead_type,connection_type,queue_type,redirected_date,status,customer_status")
      .limit(20000);

    if (leadsResult.error) {
      leadsResult = await admin
        .from("leads")
        .select("id,source,owner_id,created_at,assigned_at,lead_type,queue_type,redirected_date,status,customer_status")
        .limit(20000);
    }

    let tasksResult = await admin
      .from("tasks")
      .select("id,status,owner_id,receiver_id,done_at,completed_at,created_at,due_date")
      .limit(20000);

    if (tasksResult.error) {
      tasksResult = await admin
        .from("tasks")
        .select("id,status,owner_id,completed_at,created_at,due_date")
        .limit(20000);
    }

    const leadRows = ((leadsResult.data ?? []) as unknown as Record<string, unknown>[])
      .filter((row) => inRange(dateValue(row, ["created_at"]), from, to))
      .filter((row) => !connection || inferConnection(row) === connection)
      .filter((row) => dataType === "all" || inferLeadType(row) === "fresh");

    const sourceMap = new Map<string, number>();
    for (const row of leadRows) {
      const source = text(row.source, "غير محدد") || "غير محدد";
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
    }

    const distributionRows = ((leadsResult.data ?? []) as unknown as Record<string, unknown>[])
      .filter((row) => inRange(dateValue(row, ["assigned_at", "created_at"]), from, to))
      .filter((row) => !connection || inferConnection(row) === connection)
      .filter((row) => dataType === "all" || inferLeadType(row) === "fresh")
      .filter((row) => typeof row.owner_id === "string" && row.owner_id);

    const distributionMap = new Map<string, { id: string; name: string; fresh: number; retargeted: number; redirected: number; total: number }>();
    for (const row of distributionRows) {
      const ownerId = text(row.owner_id);
      const current = distributionMap.get(ownerId) ?? {
        id: ownerId,
        name: profileName(profileMap, ownerId),
        fresh: 0,
        retargeted: 0,
        redirected: 0,
        total: 0,
      };
      const type = inferLeadType(row);
      if (type === "retargeted") current.retargeted += 1;
      else if (type === "redirected") current.redirected += 1;
      else current.fresh += 1;
      current.total += 1;
      distributionMap.set(ownerId, current);
    }

    const completedTaskRows = ((tasksResult.data ?? []) as unknown as Record<string, unknown>[])
      .filter((row) => completedStatuses.has(text(row.status)))
      .filter((row) => inRange(dateValue(row, ["done_at", "completed_at", "due_date", "created_at"]), from, to));

    const taskMap = new Map<string, { id: string; name: string; count: number }>();
    for (const row of completedTaskRows) {
      const ownerId = text(row.receiver_id) || text(row.owner_id) || "unassigned";
      const current = taskMap.get(ownerId) ?? {
        id: ownerId,
        name: ownerId === "unassigned" ? "غير محدد" : profileName(profileMap, ownerId),
        count: 0,
      };
      current.count += 1;
      taskMap.set(ownerId, current);
    }

    const sources = Array.from(sourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const distribution = Array.from(distributionMap.values()).sort((a, b) => b.total - a.total);
    const completedTasks = Array.from(taskMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      status: "success",
      filters: { from: from.toISOString(), to: to.toISOString(), connection, dataType },
      summary: {
        customers: leadRows.length,
        sources: sources.length,
        distributed: distributionRows.length,
        completedTasks: completedTaskRows.length,
      },
      sources,
      distribution,
      completedTasks,
      requestedBy: user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
