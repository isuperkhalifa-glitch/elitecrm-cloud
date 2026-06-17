export type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";

export type PageKey =
  | "dashboard"
  | "customers"
  | "registrations"
  | "courses"
  | "training-centers"
  | "distribution"
  | "imports"
  | "commissions"
  | "invoices"
  | "users"
  | "settings"
  | "customize"
  | "leads"
  | "my-customers"
  | "tasks"
  | "deals"
  | "companies"
  | "contacts";

export const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];

export const pageAccess: Record<PageKey, Role[]> = {
  dashboard: allRoles,
  customers: allRoles,
  registrations: ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"],
  courses: ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"],
  "training-centers": ["developer", "admin", "manager", "data_analyst"],
  distribution: ["developer", "admin", "manager", "moderator"],
  imports: ["developer", "admin", "moderator", "marketer"],
  commissions: ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  invoices: ["developer", "admin", "finance"],
  users: ["developer", "admin"],
  settings: ["developer", "admin"],
  customize: ["developer", "admin"],

  leads: ["developer", "admin", "moderator", "marketer"],
  "my-customers": ["developer", "admin", "manager", "sales"],
  tasks: ["developer", "admin", "manager", "sales"],
  deals: ["developer", "admin", "manager", "sales", "finance"],
  companies: ["developer", "admin", "manager"],
  contacts: ["developer", "admin", "manager"],
};

export function normalizeRole(role?: string | null): Role {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
  if (role === "finance") return "finance";
  if (role === "data_analyst") return "data_analyst";
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
