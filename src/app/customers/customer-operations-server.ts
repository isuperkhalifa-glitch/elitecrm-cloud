import type { CustomerFilters } from "./customer-operations-types";

type SearchParams = Record<string, string | string[] | undefined>;

export const pageSizeOptions = [25, 50, 100];
export const allowedStatuses = new Set(["interested", "not_interested", "need_offer", "missed", "wrong_number", "paid", "busy"]);
export const allowedLeadTypes = new Set(["fresh", "retargeted", "redirected", "rejected"]);
export const allowedConnections = new Set(["distributed", "ivr", "manual", "redirected"]);
export const allowedStages = new Set(["interested_without_deal", "with_deal", "still_in_sales", "missed_in_sales"]);

export function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function safeNumber(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(firstValue(value));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function validDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dateRangeForFollowup(filter: string, from?: string, to?: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (filter === "overdue") return { lte: now.toISOString() };
  if (filter === "today") return { gte: todayStart.toISOString(), lte: todayEnd.toISOString() };
  if (filter === "tomorrow") {
    const tomorrow = addDays(todayStart, 1);
    return { gte: tomorrow.toISOString(), lte: endOfDay(tomorrow).toISOString() };
  }
  if (filter === "3days") return { gte: todayStart.toISOString(), lte: endOfDay(addDays(todayStart, 3)).toISOString() };
  if (filter === "7days") return { gte: todayStart.toISOString(), lte: endOfDay(addDays(todayStart, 7)).toISOString() };
  if (filter === "month") return { gte: todayStart.toISOString(), lte: endOfDay(addDays(todayStart, 30)).toISOString() };
  if (filter === "custom") {
    const range: { gte?: string; lte?: string } = {};
    const fromDate = validDate(from);
    const toDate = validDate(to);
    if (fromDate) range.gte = startOfDay(fromDate).toISOString();
    if (toDate) range.lte = endOfDay(toDate).toISOString();
    return range;
  }
  return null;
}

function cleanSearch(value: string) {
  return value.replace(/[,%]/g, "").trim();
}

export function parseCustomerFilters(resolved: SearchParams): CustomerFilters {
  return {
    q: cleanSearch(firstValue(resolved.q) ?? ""),
    status: firstValue(resolved.status) ?? "",
    owner: firstValue(resolved.owner) ?? "",
    leadType: firstValue(resolved.leadType) ?? "",
    followup: firstValue(resolved.followup) ?? "",
    startDate: firstValue(resolved.startDate) ?? "",
    endDate: firstValue(resolved.endDate) ?? "",
    course: cleanSearch(firstValue(resolved.course) ?? ""),
    source: firstValue(resolved.source) ?? "",
    connection: firstValue(resolved.connection) ?? "",
    stage: firstValue(resolved.stage) ?? "",
    city: firstValue(resolved.city) ?? "",
    education: firstValue(resolved.education) ?? "",
    createdFrom: firstValue(resolved.createdFrom) ?? "",
    createdTo: firstValue(resolved.createdTo) ?? "",
  };
}

export function uniqueText(rows: Record<string, unknown>[], key: string) {
  return Array.from(new Set(rows.map((row) => row[key]).filter((value): value is string => typeof value === "string" && value.trim().length > 0))).sort();
}
