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
  "/registrations": ["developer", "admin", "manager", "moderator", "sales", "finance", "data_analyst"],
  "/courses": ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"],
  "/training-centers": ["developer", "admin", "manager", "data_analyst"],
  "/distribution": ["developer", "admin", "manager", "moderator"],
  "/imports": ["developer", "admin", "moderator", "marketer"],
  "/commissions": ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  "/invoices": ["developer", "admin", "finance"],
  "/users": ["developer", "admin"],
  "/settings": ["developer", "admin"],
  "/customize": ["developer", "admin"],

  "/leads": ["developer", "admin", "moderator", "marketer"],
  "/my-customers": ["developer", "admin", "manager", "sales"],
  "/tasks": ["developer", "admin", "manager", "sales"],
  "/deals": ["developer", "admin", "manager", "sales", "finance"],
  "/companies": ["developer", "admin", "manager"],
  "/contacts": ["developer", "admin", "manager"],
};

export const permissionDefinitions: PermissionDefinition[] = [
  {
    role: "developer",
    labelAr: "مطور النظام",
    labelEn: "Developer",
    summaryAr: "تحكم كامل في النظام والصفحات والصلاحيات والإعدادات.",
    summaryEn: "Full system control.",
    routes: Object.keys(routeAccess),
    actionsAr: ["تخصيص النظام", "تعديل الصفحات", "إدارة الصلاحيات", "رؤية كل البيانات"],
    actionsEn: ["Customize system", "Edit pages", "Manage permissions", "View all data"],
  },
  {
    role: "admin",
    labelAr: "المدير العام",
    labelEn: "General Manager",
    summaryAr: "يرى ويدير التشغيل بالكامل بدون صلاحيات التطوير العميقة.",
    summaryEn: "Runs the whole operation.",
    routes: ["/dashboard", "/customers", "/registrations", "/courses", "/training-centers", "/distribution", "/imports", "/commissions", "/invoices", "/users", "/settings", "/customize"],
    actionsAr: ["إدارة العملاء", "إدارة التسجيلات", "إدارة المستخدمين", "مراجعة التقارير"],
    actionsEn: ["Manage customers", "Manage registrations", "Manage users", "Review reports"],
  },
  {
    role: "manager",
    labelAr: "تيم ليدر سيلز",
    labelEn: "Sales Team Leader",
    summaryAr: "يدير فريق السيلز والتوزيع والمتابعات والتسجيلات.",
    summaryEn: "Manages sales team and registrations.",
    routes: ["/dashboard", "/customers", "/registrations", "/courses", "/training-centers", "/distribution", "/commissions"],
    actionsAr: ["توزيع العملاء", "متابعة الفريق", "مراجعة التسجيلات"],
    actionsEn: ["Assign customers", "Monitor team", "Review registrations"],
  },
  {
    role: "moderator",
    labelAr: "الموديريتور",
    labelEn: "Moderator",
    summaryAr: "يستقبل العملاء من التسويق وينظفهم ويوزعهم على السيلز.",
    summaryEn: "Cleans and assigns incoming leads.",
    routes: ["/dashboard", "/customers", "/registrations", "/courses", "/distribution", "/imports"],
    actionsAr: ["إضافة العملاء", "استيراد العملاء", "توزيع العملاء"],
    actionsEn: ["Add customers", "Import customers", "Assign customers"],
  },
  {
    role: "marketer",
    labelAr: "المسوق",
    labelEn: "Marketer",
    summaryAr: "يدخل العملاء من الحملات ويتابع المصدر والدورة المبدئية.",
    summaryEn: "Adds campaign leads and source data.",
    routes: ["/dashboard", "/customers", "/courses", "/imports"],
    actionsAr: ["إدخال العملاء", "استيراد العملاء", "تحديد المصدر والحملة"],
    actionsEn: ["Add customers", "Import customers", "Set source/campaign"],
  },
  {
    role: "sales",
    labelAr: "سيلز",
    labelEn: "Sales",
    summaryAr: "يتابع العملاء الموزعين عليه ويسجلهم في الدورات.",
    summaryEn: "Follows assigned customers and registers them.",
    routes: ["/dashboard", "/customers", "/registrations", "/courses", "/commissions"],
    actionsAr: ["تحديث حالة العميل", "إضافة الملاحظات", "تسجيل العميل"],
    actionsEn: ["Update status", "Add notes", "Register customer"],
  },
  {
    role: "finance",
    labelAr: "مالية / حسابات",
    labelEn: "Finance",
    summaryAr: "يراجع المدفوعات والمتبقي والعمولات والتحصيل.",
    summaryEn: "Manages payments, balances, and commissions.",
    routes: ["/dashboard", "/customers", "/registrations", "/commissions", "/invoices"],
    actionsAr: ["تحديث الدفع", "مراجعة المتبقي", "مراجعة العمولات"],
    actionsEn: ["Update payments", "Review balances", "Review commissions"],
  },
  {
    role: "data_analyst",
    labelAr: "محلل بيانات",
    labelEn: "Data Analyst",
    summaryAr: "يرى التقارير والبيانات بدون تعديل تشغيلي حساس.",
    summaryEn: "Views reports and analytics without sensitive edits.",
    routes: ["/dashboard", "/customers", "/registrations", "/courses", "/training-centers", "/commissions"],
    actionsAr: ["تحليل العملاء", "تحليل التسجيلات", "تحليل أداء المراكز"],
    actionsEn: ["Analyze customers", "Analyze registrations", "Analyze centers"],
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
