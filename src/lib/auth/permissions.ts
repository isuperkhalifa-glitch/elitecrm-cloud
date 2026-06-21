export type AppRole =
  | "developer"
  | "admin"
  | "manager"
  | "moderator"
  | "marketer"
  | "sales"
  | "finance"
  | "data_analyst";

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

export const appRoles: AppRole[] = [
  "developer",
  "admin",
  "manager",
  "moderator",
  "marketer",
  "sales",
  "finance",
  "data_analyst",
];

export const adminRoles: AppRole[] = ["developer", "admin"];
export const operationsRoles: AppRole[] = ["developer", "admin", "manager", "moderator"];
export const salesOperationsRoles: AppRole[] = ["developer", "admin", "manager", "moderator", "sales"];
export const intakeRoles: AppRole[] = ["developer", "admin", "moderator", "marketer"];
export const financeRoles: AppRole[] = ["developer", "admin", "finance"];
export const reportingRoles: AppRole[] = ["developer", "admin", "manager", "finance", "data_analyst"];
export const dataQualityRoles: AppRole[] = ["developer", "admin", "manager", "moderator", "data_analyst"];
export const requestCreateRoles: AppRole[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance"];

export const routeAccess: Record<string, AppRole[]> = {
  "/dashboard": appRoles,
  "/calendar": salesOperationsRoles,
  "/requests": appRoles,
  "/calls": salesOperationsRoles,
  "/customers": appRoles,
  "/registrations": ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"],
  "/training-centers": ["developer", "admin", "manager", "data_analyst"],
  "/courses": appRoles,
  "/distribution": operationsRoles,
  "/data-quality": dataQualityRoles,
  "/imports": intakeRoles,
  "/commissions": ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  "/reports": reportingRoles,
  "/users": adminRoles,
  "/customize": adminRoles,
  "/settings": adminRoles,
  "/developer": ["developer"],
  "/leads": intakeRoles,
  "/my-customers": ["developer", "admin", "manager", "sales"],
  "/tasks": ["developer", "admin", "manager", "sales"],
  "/deals": ["developer", "admin", "manager", "sales", "finance"],
  "/invoices": ["developer", "admin", "manager", "sales", "finance"],
  "/companies": ["developer", "admin", "manager", "data_analyst"],
  "/contacts": ["developer", "admin", "manager"],
};

const permissionDefinitionBase: Omit<PermissionDefinition, "routes">[] = [
  {
    role: "developer",
    labelAr: "مطور النظام",
    labelEn: "Developer",
    summaryAr: "تحكم كامل في النظام والإعدادات والصلاحيات.",
    summaryEn: "Full system control.",
    actionsAr: ["تخصيص النظام", "إدارة المستخدمين", "إدارة كل الطلبات", "إصلاح البيانات"],
    actionsEn: ["Customize system", "Manage users", "Manage all requests", "Fix data"],
  },
  {
    role: "admin",
    labelAr: "المدير العام",
    labelEn: "General Manager",
    summaryAr: "يرى كل شيء ويدير التشغيل والفريق.",
    summaryEn: "Full business visibility and operations management.",
    actionsAr: ["متابعة الكل", "إدارة طلبات الفريق", "توزيع العملاء", "إدارة المستخدمين"],
    actionsEn: ["View all", "Manage team requests", "Assign customers", "Manage users"],
  },
  {
    role: "manager",
    labelAr: "تيم ليدر سيلز",
    labelEn: "Sales Team Leader",
    summaryAr: "يدير فريق السيلز والتوزيع والمتابعات والطلبات.",
    summaryEn: "Manages sales team, assignment, follow-ups, and requests.",
    actionsAr: ["إدارة طلبات الفريق", "توزيع العملاء", "تشغيل المكالمات", "متابعة الفريق"],
    actionsEn: ["Manage team requests", "Assign customers", "Run calls", "Monitor team"],
  },
  {
    role: "moderator",
    labelAr: "الموديريتور",
    labelEn: "Moderator",
    summaryAr: "يراجع العملاء ويوزعهم ويتعامل مع الطلبات الواردة والصادرة.",
    summaryEn: "Reviews customers, assigns them, and handles internal requests.",
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "مراجعة العملاء", "التوزيع"],
    actionsEn: ["Assign request", "Complete requests", "Review customers", "Assign"],
  },
  {
    role: "marketer",
    labelAr: "المسوق",
    labelEn: "Marketer",
    summaryAr: "يضيف ويستورد العملاء ويتابع المصادر والطلبات الداخلية.",
    summaryEn: "Adds and imports customers, tracks sources, and handles requests.",
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "إضافة عملاء", "استيراد"],
    actionsEn: ["Assign request", "Complete requests", "Add customers", "Import"],
  },
  {
    role: "sales",
    labelAr: "سيلز",
    labelEn: "Sales",
    summaryAr: "يشغل قائمة اتصالاته ويتابع عملاءه وينفذ الطلبات المسندة إليه.",
    summaryEn: "Runs assigned calls, follows customers, and completes assigned requests.",
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "تسجيل نتيجة المكالمة", "تسجيل العميل"],
    actionsEn: ["Assign request", "Complete requests", "Save call result", "Register customer"],
  },
  {
    role: "finance",
    labelAr: "مالية / حسابات",
    labelEn: "Finance",
    summaryAr: "يراجع المدفوعات والعمولات ويتعامل مع الطلبات الداخلية.",
    summaryEn: "Reviews payments and commissions and handles internal requests.",
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "تحديث الدفع", "مراجعة العمولات"],
    actionsEn: ["Assign request", "Complete requests", "Update payments", "Review commissions"],
  },
  {
    role: "data_analyst",
    labelAr: "محلل بيانات",
    labelEn: "Data Analyst",
    summaryAr: "يرى التقارير والطلبات بدون تعديل تشغيلي.",
    summaryEn: "Reads reports and requests without operational editing.",
    actionsAr: ["عرض الطلبات", "عرض التقارير", "تحليل الأداء"],
    actionsEn: ["View requests", "View reports", "Analyze performance"],
  },
];

export const permissionDefinitions: PermissionDefinition[] = permissionDefinitionBase.map((definition) => ({
  ...definition,
  routes: Object.entries(routeAccess)
    .filter(([, roles]) => roles.includes(definition.role))
    .map(([route]) => route),
}));

export function isAppRole(role?: string | null): role is AppRole {
  return appRoles.includes(role as AppRole);
}

export function resolveRole(role?: string | null): AppRole | null {
  return isAppRole(role) ? role : null;
}

export function normalizeRole(role?: string | null): AppRole {
  return resolveRole(role) ?? "sales";
}

export function canAccessRoute(role: string | null | undefined, pathname: string) {
  const resolvedRole = resolveRole(role);
  if (!resolvedRole) return false;

  const entry = Object.entries(routeAccess).find(
    ([route]) => pathname === route || pathname.startsWith(route + "/")
  );
  if (!entry) return true;
  return entry[1].includes(resolvedRole);
}
