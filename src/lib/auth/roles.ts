export type Role = "developer" | "admin" | "manager" | "moderator" | "sales" | "finance";

export type PageKey =
  | "dashboard"
  | "customers"
  | "my-customers"
  | "leads"
  | "tasks"
  | "deals"
  | "invoices"
  | "commissions"
  | "distribution"
  | "imports"
  | "companies"
  | "contacts"
  | "users"
  | "settings";

export const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "sales", "finance"];

export const pageAccess: Record<PageKey, Role[]> = {
  dashboard: allRoles,
  customers: allRoles,
  "my-customers": ["developer", "admin", "manager", "sales"],
  leads: ["developer", "admin", "manager", "moderator", "sales"],
  tasks: ["developer", "admin", "manager", "sales"],
  deals: ["developer", "admin", "manager", "sales"],
  invoices: ["developer", "admin", "manager", "finance", "sales"],
  commissions: ["developer", "admin", "manager", "finance", "sales"],
  distribution: ["developer", "admin", "manager", "moderator"],
  imports: ["developer", "admin", "manager", "moderator"],
  companies: ["developer", "admin", "manager"],
  contacts: ["developer", "admin", "manager"],
  users: ["developer", "admin"],
  settings: ["developer", "admin"],
};

export function normalizeRole(role?: string | null): Role {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "finance") return "finance";
  return "sales";
}

export function canAccessPage(role: string | null | undefined, pageKey: PageKey) {
  return pageAccess[pageKey].includes(normalizeRole(role));
}

export function isAdmin(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized === "developer" || normalized === "admin";
}

export function isRole(value: string): value is Role {
  return allRoles.includes(value as Role);
}
