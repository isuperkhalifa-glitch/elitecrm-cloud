export type Role = "admin" | "manager" | "moderator" | "sales" | "finance";

export type PageKey =
  | "dashboard"
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

export const allRoles: Role[] = ["admin", "manager", "moderator", "sales", "finance"];

export const pageAccess: Record<PageKey, Role[]> = {
  dashboard: allRoles,
  "my-customers": ["admin", "manager", "sales"],
  leads: ["admin", "manager", "moderator", "sales"],
  tasks: ["admin", "manager", "sales"],
  deals: ["admin", "manager", "sales"],
  invoices: ["admin", "manager", "finance", "sales"],
  commissions: ["admin", "manager", "finance", "sales"],
  distribution: ["admin", "manager", "moderator"],
  imports: ["admin", "manager", "moderator"],
  companies: ["admin", "manager"],
  contacts: ["admin", "manager"],
  users: ["admin"],
  settings: ["admin"],
};

export function normalizeRole(role?: string | null): Role {
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
  return normalizeRole(role) === "admin";
}

export function isRole(value: string): value is Role {
  return allRoles.includes(value as Role);
}
