import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedRoles = new Set(["developer", "admin", "manager", "moderator"]);
const assignableRoles = new Set(["sales", "manager"]);
const allowedActions = new Set(["assign", "unassign", "auto"]);
const maxBatchSize = 1000;

type DistributionAction = "assign" | "unassign" | "auto";
type LeadRow = { id: string; full_name: string | null; owner_id: string | null; company_id: string | null };
type AgentRow = { id: string; full_name: string | null; email: string | null; role: string | null; is_active: boolean | null };

function cleanIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item ?? "").trim()).filter(Boolean))).slice(0, maxBatchSize);
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const scope = await getEffectiveScope(profile?.role);
    const role = scope.effectiveRole;

    if (scope.previewAsUser) {
      return NextResponse.json({ status: "error", message: "معاينة المستخدم للعرض فقط. ارجع إلى رؤية الأدمن لتنفيذ التوزيع." }, { status: 403 });
    }
    if (!allowedRoles.has(role)) {
      return NextResponse.json({ status: "error", message: "هذه الصلاحية لا تسمح بتوزيع العملاء." }, { status: 403 });
    }

    const body = await request.json();
    const action = String(body.action ?? "") as DistributionAction;
    const leadIds = cleanIds(body.lead_ids);
    if (!allowedActions.has(action)) {
      return NextResponse.json({ status: "error", message: "إجراء التوزيع غير صحيح." }, { status: 422 });
    }
    if (!leadIds.length) {
      return NextResponse.json({ status: "error", message: "اختر عميلًا واحدًا على الأقل." }, { status: 422 });
    }

    const year = await getEffectiveYear();
    const range = yearDateRange(year);
    const admin = createAdminClient();
    let selectedQuery = admin
      .from("leads")
      .select("id,full_name,owner_id,company_id")
      .in("id", leadIds)
      .gte("created_at", range.from)
      .lt("created_at", range.to);
    if (scope.scopedUserId) selectedQuery = selectedQuery.eq("owner_id", scope.scopedUserId);
    if (scope.scopedCompanyId) selectedQuery = selectedQuery.eq("company_id", scope.scopedCompanyId);

    const { data: selectedLeads, error: selectedError } = await selectedQuery;
    if (selectedError) return NextResponse.json({ status: "error", message: selectedError.message }, { status: 400 });

    const leads = (selectedLeads ?? []) as LeadRow[];
    if (leads.length !== leadIds.length) {
      return NextResponse.json({ status: "error", message: "بعض العملاء غير موجودين أو خارج النطاق أو السنة المحددة." }, { status: 403 });
    }

    const actorName = profile?.full_name ?? user.email ?? "النظام";
    const now = new Date().toISOString();
    const assignments = new Map<string | null, string[]>();
    const agentsById = new Map<string, AgentRow>();

    if (action === "unassign") {
      assignments.set(null, leads.map((lead) => lead.id));
    } else if (action === "assign") {
      const targetId = String(body.target_user_id ?? "").trim();
      if (!targetId) return NextResponse.json({ status: "error", message: "اختر موظف المبيعات المستلم." }, { status: 422 });

      const { data: target } = await admin
        .from("profiles")
        .select("id,full_name,email,role,is_active")
        .eq("id", targetId)
        .maybeSingle();
      if (!target || target.is_active === false || !assignableRoles.has(target.role ?? "")) {
        return NextResponse.json({ status: "error", message: "المستخدم المحدد غير متاح لاستلام العملاء." }, { status: 422 });
      }
      agentsById.set(target.id, target as AgentRow);
      assignments.set(target.id, leads.map((lead) => lead.id));
    } else {
      const requestedAgentIds = cleanIds(body.agent_ids);
      if (!requestedAgentIds.length) {
        return NextResponse.json({ status: "error", message: "اختر موظفين للتوزيع التلقائي." }, { status: 422 });
      }

      const { data: agentRows, error: agentsError } = await admin
        .from("profiles")
        .select("id,full_name,email,role,is_active")
        .in("id", requestedAgentIds)
        .eq("is_active", true);
      if (agentsError) return NextResponse.json({ status: "error", message: agentsError.message }, { status: 400 });

      const agents = ((agentRows ?? []) as AgentRow[]).filter((agent) => assignableRoles.has(agent.role ?? ""));
      if (!agents.length) {
        return NextResponse.json({ status: "error", message: "لا يوجد موظفون نشطون صالحون للتوزيع." }, { status: 422 });
      }
      for (const agent of agents) agentsById.set(agent.id, agent);

      let loadQuery = admin
        .from("leads")
        .select("owner_id")
        .in("owner_id", agents.map((agent) => agent.id))
        .gte("created_at", range.from)
        .lt("created_at", range.to)
        .limit(20000);
      if (scope.scopedCompanyId) loadQuery = loadQuery.eq("company_id", scope.scopedCompanyId);
      const { data: currentRows } = await loadQuery;

      const load = new Map<string, number>(agents.map((agent) => [agent.id, 0]));
      for (const row of currentRows ?? []) {
        const ownerId = String(row.owner_id ?? "");
        if (load.has(ownerId)) load.set(ownerId, (load.get(ownerId) ?? 0) + 1);
      }

      for (const lead of leads) {
        const target = agents.slice().sort((a, b) => {
          const difference = (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
          return difference || a.id.localeCompare(b.id);
        })[0];
        const group = assignments.get(target.id) ?? [];
        group.push(lead.id);
        assignments.set(target.id, group);
        load.set(target.id, (load.get(target.id) ?? 0) + 1);
      }
    }

    const updatedRows: Record<string, unknown>[] = [];
    for (const [targetId, ids] of assignments) {
      const basePatch: Record<string, unknown> = { owner_id: targetId, assigned_at: targetId ? now : null, assigned_by: user.id };
      const enhancedPatch = { ...basePatch, call_receiver_id: targetId, connection_type: targetId ? "distributed" : "manual" };
      let result = await admin.from("leads").update(enhancedPatch).in("id", ids).select("*");
      if (result.error) result = await admin.from("leads").update(basePatch).in("id", ids).select("*");
      if (result.error) return NextResponse.json({ status: "error", message: result.error.message }, { status: 400 });
      updatedRows.push(...((result.data ?? []) as Record<string, unknown>[]));
    }

    const ownerByLead = new Map<string, string | null>();
    for (const [targetId, ids] of assignments) for (const id of ids) ownerByLead.set(id, targetId);
    const activityRows = leads.map((lead) => {
      const newOwner = ownerByLead.get(lead.id) ?? null;
      return {
        lead_id: lead.id,
        actor_id: user.id,
        actor_name: actorName,
        action: newOwner ? (lead.owner_id ? "customer_reassigned" : "customer_assigned") : "customer_unassigned",
        old_value: lead.owner_id,
        new_value: newOwner,
        note: newOwner
          ? `تم توزيع العميل على ${agentsById.get(newOwner)?.full_name ?? agentsById.get(newOwner)?.email ?? newOwner}`
          : "تمت إعادة العميل إلى قائمة غير الموزعين",
      };
    });
    if (activityRows.length) await admin.from("customer_activities").insert(activityRows);

    const notificationRows = Array.from(assignments.entries())
      .filter(([targetId]) => Boolean(targetId))
      .map(([targetId, ids]) => ({
        user_id: targetId as string,
        type: "assignment",
        entity_type: "leads",
        action: "assigned",
        title: "تم إسناد عملاء جدد إليك",
        body: `تم إسناد ${ids.length} عميل إليك بواسطة ${actorName}`,
        is_read: false,
      }));
    if (notificationRows.length) await admin.from("notifications").insert(notificationRows);

    return NextResponse.json({
      status: "success",
      message: action === "auto" ? "تم التوزيع التلقائي حسب أقل حمل حالي." : action === "unassign" ? "تمت إعادة العملاء إلى قائمة غير الموزعين." : "تم توزيع العملاء بنجاح.",
      data: updatedRows,
      summary: Array.from(assignments.entries()).map(([targetId, ids]) => ({ target_user_id: targetId, count: ids.length })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
