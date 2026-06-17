export type AppRole = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";

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

export const appRoles: AppRole[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];

export const routeAccess: Record<string, AppRole[]> = {
  "/dashboard": appRoles,
  "/customers": appRoles,
  "/registrations": ["developer", "admin", "manager", "moderator", "sales", "finance"],
  "/training-centers": ["developer", "admin", "manager", "data_analyst"],
  "/courses": ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"],
  "/distribution": ["developer", "admin", "manager", "moderator"],
  "/imports": ["developer", "admin", "moderator", "marketer"],
  "/commissions": ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  "/users": ["developer", "admin"],
  "/customize": ["developer", "admin"],
  "/settings": ["developer", "admin"],

  "/leads": ["developer", "admin", "moderator", "marketer"],
  "/my-customers": ["developer", "admin", "manager", "sales"],
  "/tasks": ["developer", "admin", "manager", "sales"],
  "/deals": ["developer", "admin", "manager", "sales", "finance"],
  "/invoices": ["developer", "admin", "manager", "sales", "finance"],
  "/companies": ["developer", "admin", "manager", "data_analyst"],
  "/contacts": ["developer", "admin", "manager"],
};

export const permissionDefinitions: PermissionDefinition[] = [
  {
    role: "developer",
    labelAr: "مطور النظام",
    labelEn: "Developer",
    summaryAr: "تحكم كامل في النظام والإعدادات والصلاحيات.",
    summaryEn: "Full system control.",
    routes: ["/dashboard", "/customers", "/registrations", "/training-centers", "/courses", "/distribution", "/imports", "/commissions", "/users", "/settings", "/customize"],
    actionsAr: ["تخصيص النظام", "إدارة المستخدمين", "إصلاح البيانات"],
    actionsEn: ["Customize system", "Manage users", "Fix data"],
  },
  {
    role: "admin",
    labelAr: "المدير العام",
    labelEn: "General Manager",
    summaryAr: "يرى كل شيء ويدير التشغيل والفريق.",
    summaryEn: "Full business visibility and operations management.",
    routes: ["/dashboard", "/customers", "/registrations", "/training-centers", "/courses", "/distribution", "/imports", "/commissions", "/users", "/settings"],
    actionsAr: ["متابعة الكل", "توزيع العملاء", "إدارة المستخدمين"],
    actionsEn: ["View all", "Assign customers", "Manage users"],
  },
  {
    role: "manager",
    labelAr: "تيم ليدر سيلز",
    labelEn: "Sales Team Leader",
    summaryAr: "يدير فريق السيلز والتوزيع والمتابعات.",
    summaryEn: "Manages sales team, assignment, and follow-ups.",
    routes: ["/dashboard", "/customers", "/registrations", "/distribution", "/courses", "/commissions"],
    actionsAr: ["توزيع العملاء", "متابعة الفريق"],
    actionsEn: ["Assign customers", "Monitor team"],
  },
  {
    role: "moderator",
    labelAr: "الموديريتور",
    labelEn: "Moderator",
    summaryAr: "يراجع الليدز ويوزعها على السيلز.",
    summaryEn: "Reviews and assigns leads.",
    routes: ["/dashboard", "/customers", "/distribution", "/imports"],
    actionsAr: ["مراجعة العملاء", "التوزيع"],
    actionsEn: ["Review customers", "Assign"],
  },
  {
    role: "marketer",
    labelAr: "المسوق",
    labelEn: "Marketer",
    summaryAr: "يضيف ويستورد الليدز ويتابع المصادر.",
    summaryEn: "Adds/imports leads and tracks sources.",
    routes: ["/dashboard", "/customers", "/imports", "/courses"],
    actionsAr: ["إضافة ليدز", "استيراد", "تحديد المصدر"],
    actionsEn: ["Add leads", "Import", "Set source"],
  },
  {
    role: "sales",
    labelAr: "سيلز",
    labelEn: "Sales",
    summaryAr: "يتابع عملاءه ويسجلهم في الدورات.",
    summaryEn: "Follows assigned customers and registers them.",
    routes: ["/dashboard", "/customers", "/registrations", "/commissions"],
    actionsAr: ["تغيير الحالة", "تحديد متابعة", "تسجيل العميل"],
    actionsEn: ["Update status", "Set follow-up", "Register customer"],
  },
  {
    role: "finance",
    labelAr: "مالية / حسابات",
    labelEn: "Finance",
    summaryAr: "يراجع المدفوعات والمتبقي والعمولات.",
    summaryEn: "Reviews payments, balances, and commissions.",
    routes: ["/dashboard", "/customers", "/registrations", "/commissions"],
    actionsAr: ["تحديث الدفع", "مراجعة العمولات"],
    actionsEn: ["Update payments", "Review commissions"],
  },
  {
    role: "data_analyst",
    labelAr: "محلل بيانات",
    labelEn: "Data Analyst",
    summaryAr: "يرى التقارير والمؤشرات بدون تعديل تشغيلي.",
    summaryEn: "Reads reports and KPIs without operational editing.",
    routes: ["/dashboard", "/customers", "/training-centers", "/courses", "/commissions"],
    actionsAr: ["عرض التقارير", "تحليل الأداء"],
    actionsEn: ["View reports", "Analyze performance"],
  },
];

export function normalizeRole(role?: string | null): AppRole {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
  if (role === "finance") return "finance";
  if (role === "data_analyst") return "data_analyst";
  return "sales";
}

export function canAccessRoute(role: string | null | undefined, pathname: string) {
  const normalized = normalizeRole(role);
  const entry = Object.entries(routeAccess).find(([route]) => pathname === route || pathname.startsWith(route + "/"));
  if (!entry) return true;
  return entry[1].includes(normalized);
}
