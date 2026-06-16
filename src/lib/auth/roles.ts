export type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "marketer";

export type PageKey =
  | "dashboard"
  | "customers"
  | "courses"
  | "training-centers"
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
  | "settings"
  | "customize";

export const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance"];

export const pageAccess: Record<PageKey, Role[]> = {
  dashboard: allRoles,
  customers: allRoles,
  courses: ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance"],
  "training-centers": ["developer", "admin", "manager"],
  "my-customers": ["developer", "admin", "manager", "sales"],
  leads: ["developer", "admin", "moderator", "marketer"],
  tasks: ["developer", "admin", "manager", "sales"],
  deals: ["developer", "admin", "manager", "sales"],
  invoices: ["developer", "admin", "manager", "finance", "sales"],
  commissions: ["developer", "admin", "manager", "finance", "sales"],
  distribution: ["developer", "admin", "manager", "moderator"],
  imports: ["developer", "admin", "moderator", "marketer"],
  companies: ["developer", "admin", "manager"],
  contacts: ["developer", "admin", "manager"],
  users: ["developer", "admin"],
  settings: ["developer", "admin"],
  customize: ["developer", "admin"],
};

export function normalizeRole(role?: string | null): Role {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
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
