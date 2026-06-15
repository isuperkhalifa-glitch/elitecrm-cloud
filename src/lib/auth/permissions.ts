export type AppRole = "developer" | "admin" | "manager" | "moderator" | "sales" | "finance";

export type PermissionDefinition = {
  role: AppRole;
  labelAr: string;
  labelEn: string;
  summaryAr: string;
  summaryEn: string;
  routes: string[];
  actionsAr: string[];
  actionsEn: string[];
};

export const appRoles: AppRole[] = ["developer", "admin", "manager", "moderator", "sales", "finance"];

export const routeAccess: Record<string, AppRole[]> = {
  "/dashboard": ["developer", "admin", "manager", "moderator", "sales", "finance"],
  "/customers": ["developer", "admin", "manager", "moderator", "sales", "finance"],
  "/courses": ["developer", "admin", "manager"],
  "/leads": ["developer", "admin", "manager", "moderator", "sales"],
  "/my-customers": ["developer", "admin", "manager", "sales"],
  "/distribution": ["developer", "admin", "manager", "moderator"],
  "/imports": ["developer", "admin", "manager", "moderator"],
  "/tasks": ["developer", "admin", "manager", "sales"],
  "/deals": ["developer", "admin", "manager", "sales", "finance"],
  "/invoices": ["developer", "admin", "manager", "sales", "finance"],
  "/commissions": ["developer", "admin", "manager", "sales", "finance"],
  "/companies": ["developer", "admin", "manager"],
  "/contacts": ["developer", "admin", "manager"],
  "/users": ["developer", "admin"],
  "/customize": ["developer", "admin"],
  "/settings": ["developer", "admin"],
};

export const permissionDefinitions: PermissionDefinition[] = [
  {
    role: "developer",
    labelAr: "\u0645\u0637\u0648\u0631 \u0627\u0644\u0646\u0638\u0627\u0645",
    labelEn: "Developer",
    summaryAr: "\u0635\u0644\u0627\u062d\u064a\u0629 \u0645\u062a\u0642\u062f\u0645\u0629 \u0644\u062a\u062e\u0635\u064a\u0635 \u0648\u062a\u0639\u062f\u064a\u0644 \u0643\u0644 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0646\u0638\u0627\u0645.",
    summaryEn: "Advanced role for detailed system customization.",
    routes: ["/dashboard", "/customers", "/leads", "/my-customers", "/distribution", "/imports", "/tasks", "/deals", "/invoices", "/commissions", "/companies", "/contacts", "/users", "/settings", "/customize"],
    actionsAr: ["\u062a\u062e\u0635\u064a\u0635 \u0627\u0644\u0646\u0638\u0627\u0645", "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0635\u0641\u062d\u0627\u062a", "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a", "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a"],
    actionsEn: ["Customize system", "Edit pages", "Manage settings", "Manage permissions"],
  },
  {
    role: "admin",
    labelAr: "\u0645\u062f\u064a\u0631 \u0627\u0644\u0646\u0638\u0627\u0645",
    labelEn: "Admin",
    summaryAr: "\u064a\u0631\u0649 \u0643\u0644 \u0634\u064a\u0621 \u0648\u064a\u062f\u064a\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a.",
    summaryEn: "Sees and manages the whole system.",
    routes: ["/dashboard", "/leads", "/my-customers", "/distribution", "/imports", "/tasks", "/deals", "/invoices", "/commissions", "/companies", "/contacts", "/users", "/settings"],
    actionsAr: ["\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646", "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a", "\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621", "\u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a"],
    actionsEn: ["Manage users", "Edit settings", "Distribute customers", "Finance and commissions"],
  },
  {
    role: "manager",
    labelAr: "\u0645\u062f\u064a\u0631",
    labelEn: "Manager",
    summaryAr: "\u064a\u0631\u0627\u0642\u0628 \u0648\u064a\u062f\u064a\u0631 \u0627\u0644\u062a\u0634\u063a\u064a\u0644 \u0628\u062f\u0648\u0646 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645 \u0623\u0648 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646.",
    summaryEn: "Runs operations without system/user admin controls.",
    routes: ["/dashboard", "/leads", "/my-customers", "/distribution", "/imports", "/tasks", "/deals", "/invoices", "/commissions", "/companies", "/contacts"],
    actionsAr: ["\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0641\u0631\u064a\u0642", "\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621", "\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631 \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a"],
    actionsEn: ["Monitor team", "Distribute customers", "Review invoices and commissions"],
  },
  {
    role: "moderator",
    labelAr: "\u0645\u0648\u062f\u064a\u0631\u064a\u062a\u0648\u0631",
    labelEn: "Moderator",
    summaryAr: "\u064a\u0636\u064a\u0641 \u0648\u064a\u0633\u062a\u0648\u0631\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u064a\u0648\u0632\u0639\u0647\u0645 \u0639\u0644\u0649 \u0627\u0644\u0633\u064a\u0644\u0632.",
    summaryEn: "Adds/imports customers and assigns them to sales.",
    routes: ["/dashboard", "/leads", "/distribution", "/imports"],
    actionsAr: ["\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u0644\u0627\u0621", "\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0628\u064a\u0627\u0646\u0627\u062a", "\u062a\u0648\u0632\u064a\u0639 \u0639\u0644\u0649 \u0627\u0644\u0633\u064a\u0644\u0632"],
    actionsEn: ["Add customers", "Import data", "Assign to sales"],
  },
  {
    role: "sales",
    labelAr: "\u0633\u064a\u0644\u0632",
    labelEn: "Sales",
    summaryAr: "\u064a\u062a\u0627\u0628\u0639 \u0639\u0645\u0644\u0627\u0621\u0647 \u0648\u0645\u0647\u0627\u0645\u0647 \u0648\u0635\u0641\u0642\u0627\u062a\u0647 \u0648\u0639\u0645\u0648\u0644\u0627\u062a\u0647.",
    summaryEn: "Follows own customers, tasks, deals, invoices, and commissions.",
    routes: ["/dashboard", "/leads", "/my-customers", "/tasks", "/deals", "/invoices", "/commissions"],
    actionsAr: ["\u062a\u063a\u064a\u064a\u0631 \u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0645\u064a\u0644", "\u0643\u062a\u0627\u0628\u0629 \u0645\u0644\u0627\u062d\u0638\u0627\u062a", "\u062a\u062d\u062f\u064a\u062f \u0645\u0648\u0639\u062f \u0645\u062a\u0627\u0628\u0639\u0629"],
    actionsEn: ["Update customer status", "Write notes", "Set follow-up"],
  },
  {
    role: "finance",
    labelAr: "\u0645\u0627\u0644\u064a\u0629",
    labelEn: "Finance",
    summaryAr: "\u064a\u062f\u064a\u0631 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631 \u0648\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a.",
    summaryEn: "Manages invoices, payments, and commissions.",
    routes: ["/dashboard", "/deals", "/invoices", "/commissions"],
    actionsAr: ["\u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u062f\u0641\u0639", "\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062a", "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u062a\u062d\u0635\u064a\u0644"],
    actionsEn: ["Update payment status", "Review commissions", "Track collection"],
  },
];

export function normalizeRole(role?: string | null): AppRole {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "finance") return "finance";
  return "sales";
}

export function canAccessRoute(role: string | null | undefined, pathname: string) {
  const normalized = normalizeRole(role);
  const entry = Object.entries(routeAccess).find(([route]) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!entry) return true;
  return entry[1].includes(normalized);
}
