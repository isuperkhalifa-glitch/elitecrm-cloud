import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { CustomersClient } from "./customers-client";

type SearchParams = Record<string, string | string[] | undefined>;

const pageSizeOptions = [25, 50, 100];
const allowedStatuses = new Set([
  "interested",
  "not_interested",
  "need_offer",
  "missed",
  "wrong_number",
  "paid",
  "busy",
]);
const allowedLeadTypes = new Set(["fresh", "retargeted", "redirected"]);

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeNumber(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(firstValue(value));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIso(date: Date) {
  return date.toISOString();
}

function dateRangeForFollowup(filter: string | null, from?: string | null, to?: string | null) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (filter === "overdue") {
    return { lte: toIso(now) };
  }

  if (filter === "today") {
    return { gte: toIso(todayStart), lte: toIso(todayEnd) };
  }

  if (filter === "tomorrow") {
    const tomorrow = addDays(todayStart, 1);
    return { gte: toIso(tomorrow), lte: toIso(endOfDay(tomorrow)) };
  }

  if (filter === "3days") {
    return { gte: toIso(todayStart), lte: toIso(endOfDay(addDays(todayStart, 3))) };
  }

  if (filter === "7days" || filter === "week") {
    return { gte: toIso(todayStart), lte: toIso(endOfDay(addDays(todayStart, 7))) };
  }

  if (filter === "month") {
    return { gte: toIso(todayStart), lte: toIso(endOfDay(addDays(todayStart, 30))) };
  }

  if (filter === "custom") {
    const range: { gte?: string; lte?: string } = {};
    if (from) range.gte = toIso(startOfDay(new Date(from)));
    if (to) range.lte = toIso(endOfDay(new Date(to)));
    return range;
  }

  return null;
}

function cleanSearch(value: string) {
  return value.replace(/[,%]/g, "").trim();
}

export default async function CustomersPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }) {
  const resolved = searchParams ? await searchParams : {};
  const { supabase, user, profile } = await getCurrentUserProfile();
  requirePageAccess(profile?.role, "customers");

  const role = profile?.role ?? null;
  const page = safeNumber(resolved.page, 1);
  const pageSizeInput = safeNumber(resolved.pageSize, 50);
  const pageSize = pageSizeOptions.includes(pageSizeInput) ? pageSizeInput : 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const q = cleanSearch(firstValue(resolved.q) ?? "");
  const status = firstValue(resolved.status) ?? "";
  const owner = firstValue(resolved.owner) ?? "";
  const leadType = firstValue(resolved.leadType) ?? "";
  const followup = firstValue(resolved.followup) ?? "";
  const startDate = firstValue(resolved.startDate) ?? "";
  const endDate = firstValue(resolved.endDate) ?? "";
  const course = cleanSearch(firstValue(resolved.course) ?? "");

  let leadsQuery = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("next_follow_up_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (role === "sales") {
    leadsQuery = leadsQuery.eq("owner_id", user.id);
  }

  if (role === "finance") {
    leadsQuery = leadsQuery.or("payment_status.eq.paid,status.eq.paid,customer_status.eq.paid");
  }

  if (q) {
    leadsQuery = leadsQuery.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,phone_number.ilike.%${q}%,email.ilike.%${q}%,program.ilike.%${q}%,company_name.ilike.%${q}%`
    );
  }

  if (allowedStatuses.has(status)) {
    leadsQuery = leadsQuery.or(`status.eq.${status},customer_status.eq.${status}`);
  }

  if (allowedLeadTypes.has(leadType)) {
    leadsQuery = leadsQuery.eq("lead_type", leadType);
  }

  if (owner && role !== "sales") {
    leadsQuery = leadsQuery.eq("owner_id", owner);
  }

  if (course) {
    leadsQuery = leadsQuery.or(`program.ilike.%${course}%,course_name.ilike.%${course}%`);
  }

  const followupRange = dateRangeForFollowup(followup, startDate, endDate);
  if (followupRange?.gte) leadsQuery = leadsQuery.gte("next_follow_up_at", followupRange.gte);
  if (followupRange?.lte) leadsQuery = leadsQuery.lte("next_follow_up_at", followupRange.lte);

  const [{ data: leads, count }, { data: profiles }] = await Promise.all([
    leadsQuery,
    supabase
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  const leadIds = (leads ?? []).map((lead: any) => lead.id);
  let activities: any[] = [];

  if (leadIds.length) {
    const { data } = await supabase
      .from("customer_activities")
      .select("id,lead_id,actor_id,actor_name,action,old_value,new_value,note,created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false })
      .limit(300);

    activities = data ?? [];
  }

  return (
    <AppShell
      titleKey="customers"
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={role}
    >
      <CustomersClient
        initialLeads={(leads ?? []) as any}
        initialActivities={activities as any}
        profiles={(profiles ?? []) as any}
        currentUserId={user.id}
        currentUserName={profile?.full_name ?? user.email ?? "User"}
        userEmail={user.email ?? null}
        fullName={profile?.full_name ?? null}
        role={role}
        totalCount={count ?? 0}
        page={page}
        pageSize={pageSize}
        initialFilters={{ q, status, owner, leadType, followup, startDate, endDate, course }}
      />
    </AppShell>
  );
}
