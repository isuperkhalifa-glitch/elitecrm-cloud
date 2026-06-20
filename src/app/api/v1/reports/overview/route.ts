import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  completedStatuses,
  dateValue,
  endOfDay,
  inferConnection,
  inferLeadType,
  inRange,
  profileName,
  startOfDay,
  text,
  validDate,
  type Row,
} from "./report-data";

const allowedRoles = new Set(["developer", "admin", "manager", "finance", "data_analyst"]);

export async function GET(request: Request) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const realRole = profile?.role ?? "sales";
    if (!allowedRoles.has(realRole)) {
      return NextResponse.json({ status: "error", message: "لا تملك صلاحية عرض التقارير." }, { status: 403 });
    }

    const scope = await getEffectiveScope(profile?.role);
    const url = new URL(request.url);
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    const from = startOfDay(validDate(url.searchParams.get("from"), defaultFrom));
    const to = endOfDay(validDate(url.searchParams.get("to"), now));
    const connection = url.searchParams.get("connection") ?? "";
    const dataType = url.searchParams.get("dataType") === "new" ? "new" : "all";

    const admin = createAdminClient();
    const profilesResult = await admin.from("profiles").select("id,full_name,email").order("full_name");
    const profileMap = new Map<string, string>();
    for (const item of (profilesResult.data ?? []) as unknown as Row[]) {
      const id = text(item.id);
      if (id) profileMap.set(id, text(item.full_name) || text(item.email) || id);
    }

    const enhancedLeads = await admin
      .from("leads")
      .select("id,source,owner_id,company_id,created_at,assigned_at,lead_type,connection_type,queue_type,redirected_date,status,customer_status")
      .limit(20000);

    let rawLeads = (enhancedLeads.data ?? []) as unknown as Row[];
    if (enhancedLeads.error) {
      const fallback = await admin
        .from("leads")
        .select("id,source,owner_id,company_id,created_at,assigned_at,lead_type,queue_type,redirected_date,status,customer_status")
        .limit(20000);
      rawLeads = (fallback.data ?? []) as unknown as Row[];
    }

    const enhancedTasks = await admin
      .from("tasks")
      .select("id,status,owner_id,receiver_id,related_id,done_at,completed_at,created_at,due_date")
      .limit(20000);

    let rawTasks = (enhancedTasks.data ?? []) as unknown as Row[];
    if (enhancedTasks.error) {
      const fallback = await admin
        .from("tasks")
        .select("id,status,owner_id,related_id,completed_at,created_at,due_date")
        .limit(20000);
      rawTasks = (fallback.data ?? []) as unknown as Row[];
    }

    const scopedLeads = rawLeads.filter((row) => {
      if (scope.scopedUserId && row.owner_id !== scope.scopedUserId) return false;
      if (scope.scopedCompanyId && row.company_id !== scope.scopedCompanyId) return false;
      return true;
    });
    const visibleLeadIds = new Set(scopedLeads.map((row) => text(row.id)).filter(Boolean));
    const scopedTasks = rawTasks.filter((row) => {
      if (scope.scopedUserId && row.receiver_id !== scope.scopedUserId && row.owner_id !== scope.scopedUserId) return false;
      if (scope.scopedCompanyId && !visibleLeadIds.has(text(row.related_id))) return false;
      return true;
    });

    const leadRows = scopedLeads
      .filter((row) => inRange(dateValue(row, ["created_at"]), from, to))
      .filter((row) => !connection || inferConnection(row) === connection)
      .filter((row) => dataType === "all" || inferLeadType(row) === "fresh");

    const sourceMap = new Map<string, number>();
    for (const row of leadRows) {
      const source = text(row.source, "غير محدد") || "غير محدد";
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
    }

    const distributionRows = scopedLeads
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

    const completedTaskRows = scopedTasks
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

    const sources = Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const distribution = Array.from(distributionMap.values()).sort((a, b) => b.total - a.total);
    const completedTasks = Array.from(taskMap.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      status: "success",
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
