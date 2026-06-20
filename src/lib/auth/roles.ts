export type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";

export type PageKey =
  | "dashboard"
  | "customers"
  | "registrations"
  | "courses"
  | "training-centers"
  | "distribution"
  | "data-quality"
  | "imports"
  | "commissions"
  | "reports"
  | "users"
  | "settings"
  | "customize"
  | "leads"
  | "my-customers"
  | "tasks"
  | "deals"
  | "invoices"
  | "companies"
  | "contacts";

export const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];
export const adminRoles: Role[] = ["developer", "admin"];
export const operationsRoles: Role[] = ["developer", "admin", "manager", "moderator"];
export const salesRoles: Role[] = ["developer", "admin", "manager", "sales"];
export const intakeRoles: Role[] = ["developer", "admin", "moderator", "marketer"];
export const financeRoles: Role[] = ["developer", "admin", "finance"];
export const reportingRoles: Role[] = ["developer", "admin", "manager", "finance", "data_analyst"];
export const dataQualityRoles: Role[] = ["developer", "admin", "manager", "moderator", "data_analyst"];

export const pageAccess: Record<PageKey, Role[]> = {
  dashboard: allRoles,
  customers: allRoles,
  registrations: ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"],
  courses: allRoles,
  "training-centers": ["developer", "admin", "manager", "data_analyst"],
  distribution: operationsRoles,
  "data-quality": dataQualityRoles,
  imports: intakeRoles,
  commissions: ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  reports: reportingRoles,
  users: adminRoles,
  settings: adminRoles,
  customize: adminRoles,
  leads: intakeRoles,
  "my-customers": salesRoles,
  tasks: salesRoles,
  deals: salesRoles,
  invoices: ["developer", "admin", "manager", "finance", "sales"],
  companies: ["developer", "admin", "manager", "data_analyst"],
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
