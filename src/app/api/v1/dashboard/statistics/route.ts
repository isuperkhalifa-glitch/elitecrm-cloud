import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { createAdminClient } from "@/lib/supabase/admin";

function parseDate(value: string | null, fallback: Date, end = false) {
  const date = value ? new Date(value) : new Date(fallback);
  if (Number.isNaN(date.getTime())) return new Date(fallback);
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  }
  return date;
}

export async function GET(request: Request) {
  try {
    const { user, profile } = await getCurrentUserProfile();
    const scope = await getEffectiveScope(profile?.role);
    const selectedYear = await getEffectiveYear();
    const yearRange = yearDateRange(selectedYear);
    const yearStart = new Date(yearRange.from);
    const yearEnd = new Date(new Date(yearRange.to).getTime() - 1);
    const url = new URL(request.url);
    let startDate = parseDate(url.searchParams.get("start_date"), yearStart);
    let endDate = parseDate(url.searchParams.get("end_date"), yearEnd, true);
    if (startDate < yearStart) startDate = yearStart;
    if (endDate > yearEnd) endDate = yearEnd;
    if (startDate > endDate) startDate = yearStart;

    const admin = createAdminClient();
    const effectiveUserId = scope.scopedUserId ?? (scope.effectiveRole === "sales" ? user.id : null);

    let leadsQuery = admin
      .from("leads")
      .select("id,owner_id,company_id,source,status,customer_status,lead_type,created_at,paid_amount")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .limit(10000);
    if (effectiveUserId) leadsQuery = leadsQuery.eq("owner_id", effectiveUserId);
    if (scope.scopedCompanyId) leadsQuery = leadsQuery.eq("company_id", scope.scopedCompanyId);

    let callsQuery = admin
      .from("call_logs")
      .select("id,lead_id,actor_id,outcome,created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .limit(10000);
    if (effectiveUserId) callsQuery = callsQuery.eq("actor_id", effectiveUserId);

    const [{ data: leads }, { data: calls }, { data: profiles }] = await Promise.all([
      leadsQuery,
      callsQuery,
      admin.from("profiles").select("id,full_name,email,is_active").eq("is_active", true),
    ]);

    const leadRows = leads ?? [];
    const visibleLeadIds = new Set(leadRows.map((lead) => lead.id));
    const callRows = (calls ?? []).filter((call) => !scope.scopedCompanyId || !call.lead_id || visibleLeadIds.has(call.lead_id));
    const distributed = leadRows.filter((lead) => Boolean(lead.owner_id)).length;
    const manual = leadRows.filter((lead) => !lead.source || ["manual", "يدوي"].includes(String(lead.source).toLowerCase())).length;
    const wrongNumbers = leadRows.filter((lead) => (lead.customer_status ?? lead.status) === "wrong_number").length;
    const qualified = leadRows.filter((lead) => ["interested", "need_offer", "paid"].includes(lead.customer_status ?? lead.status ?? "")).length;
    const notInterested = leadRows.filter((lead) => (lead.customer_status ?? lead.status) === "not_interested").length;
    const paid = leadRows.filter((lead) => (lead.customer_status ?? lead.status) === "paid").length;
    const netFreshLeads = Math.max(0, leadRows.length - wrongNumbers);
    const interestedRatio = qualified + notInterested > 0 ? (qualified / (qualified + notInterested)) * 100 : 0;
    const conversionRate = netFreshLeads > 0 ? (paid / netFreshLeads) * 100 : 0;
    const revenue = leadRows.reduce((sum, lead) => sum + Number(lead.paid_amount ?? 0), 0);

    const profileMap = new Map((profiles ?? []).map((item) => [item.id, item.full_name ?? item.email ?? item.id]));
    const agentMap = new Map<string, { user_id: string; name: string; leads: number; calls: number; paid: number }>();

    for (const lead of leadRows) {
      if (!lead.owner_id) continue;
      const current = agentMap.get(lead.owner_id) ?? { user_id: lead.owner_id, name: profileMap.get(lead.owner_id) ?? lead.owner_id, leads: 0, calls: 0, paid: 0 };
      current.leads += 1;
      if ((lead.customer_status ?? lead.status) === "paid") current.paid += 1;
      agentMap.set(lead.owner_id, current);
    }

    for (const call of callRows) {
      if (!call.actor_id) continue;
      const current = agentMap.get(call.actor_id) ?? { user_id: call.actor_id, name: profileMap.get(call.actor_id) ?? call.actor_id, leads: 0, calls: 0, paid: 0 };
      current.calls += 1;
      agentMap.set(call.actor_id, current);
    }

    const agents = Array.from(agentMap.values())
      .map((agent) => ({ ...agent, conversion_rate: agent.leads > 0 ? Number(((agent.paid / agent.leads) * 100).toFixed(2)) : 0 }))
      .sort((a, b) => b.paid - a.paid || b.calls - a.calls);

    const campaignMap = new Map<string, { source: string; leads: number; paid: number }>();
    for (const lead of leadRows) {
      const source = String(lead.source || "غير محدد");
      const current = campaignMap.get(source) ?? { source, leads: 0, paid: 0 };
      current.leads += 1;
      if ((lead.customer_status ?? lead.status) === "paid") current.paid += 1;
      campaignMap.set(source, current);
    }
    const campaigns = Array.from(campaignMap.values())
      .map((item) => ({ ...item, conversion_rate: item.leads > 0 ? Number(((item.paid / item.leads) * 100).toFixed(2)) : 0 }))
      .sort((a, b) => b.leads - a.leads);

    return NextResponse.json({
      status: "success",
      range: { start_date: startDate.toISOString(), end_date: endDate.toISOString(), year: selectedYear },
      metrics: {
        total_leads: leadRows.length,
        distributed,
        manually_entered: manual,
        wrong_numbers: wrongNumbers,
        qualified,
        not_interested: notInterested,
        paid,
        calls: callRows.length,
        net_fresh_leads: netFreshLeads,
        interested_ratio: Number(interestedRatio.toFixed(2)),
        conversion_rate: Number(conversionRate.toFixed(2)),
        revenue: Number(revenue.toFixed(2)),
      },
      agents,
      campaigns,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
