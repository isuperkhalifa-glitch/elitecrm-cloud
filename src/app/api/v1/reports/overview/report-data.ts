export type Row = Record<string, unknown>;

export const completedStatuses = new Set(["done", "completed", "closed", "finished"]);

export function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function validDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
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

export function dateValue(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value !== "string" || !value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

export function inRange(date: Date | null, from: Date, to: Date) {
  return Boolean(date && date >= from && date <= to);
}

export function inferConnection(row: Row) {
  const direct = text(row.connection_type);
  if (direct) return direct;
  if (text(row.lead_type) === "redirected" || row.redirected_date) return "redirected";
  if (text(row.source).toLowerCase().includes("ivr")) return "ivr";
  if (text(row.queue_type) === "manual") return "manual";
  return row.owner_id ? "distributed" : "manual";
}

export function inferLeadType(row: Row) {
  const direct = text(row.lead_type);
  if (["fresh", "retargeted", "redirected"].includes(direct)) return direct;
  return inferConnection(row) === "redirected" ? "redirected" : "fresh";
}

export function profileName(profileMap: Map<string, string>, id: unknown) {
  return typeof id === "string" && id ? profileMap.get(id) ?? id : "غير محدد";
}
