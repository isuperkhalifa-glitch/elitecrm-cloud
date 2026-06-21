import {
  adminRoles,
  appRoles,
  canAccessRoute,
  dataQualityRoles,
  financeRoles,
  intakeRoles,
  isAppRole,
  normalizeRole,
  operationsRoles,
  reportingRoles,
  routeAccess,
  type AppRole,
} from "@/lib/auth/permissions";

export type Role = AppRole;

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

const pageRoutes: Record<PageKey, string> = {
  dashboard: "/dashboard",
  customers: "/customers",
  registrations: "/registrations",
  courses: "/courses",
  "training-centers": "/training-centers",
  distribution: "/distribution",
  "data-quality": "/data-quality",
  imports: "/imports",
  commissions: "/commissions",
  reports: "/reports",
  users: "/users",
  settings: "/settings",
  customize: "/customize",
  leads: "/leads",
  "my-customers": "/my-customers",
  tasks: "/tasks",
  deals: "/deals",
  invoices: "/invoices",
  companies: "/companies",
  contacts: "/contacts",
};

export const allRoles = appRoles;
export { adminRoles, operationsRoles, intakeRoles, financeRoles, reportingRoles, dataQualityRoles, normalizeRole };
export const salesRoles: Role[] = ["developer", "admin", "manager", "sales"];

export const pageAccess: Record<PageKey, Role[]> = Object.fromEntries(
  Object.entries(pageRoutes).map(([pageKey, route]) => [pageKey, routeAccess[route] ?? []])
) as Record<PageKey, Role[]>;

export function canAccessPage(role: string | null | undefined, pageKey: PageKey) {
  return canAccessRoute(role, pageRoutes[pageKey]);
}

export function isAdmin(role: string | null | undefined) {
  const normalized = isAppRole(role) ? role : null;
  return normalized === "developer" || normalized === "admin";
}

export function isRole(value: string): value is Role {
  return isAppRole(value);
}
