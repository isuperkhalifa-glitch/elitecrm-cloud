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
  "/training-centers": ["developer", "admin", "manager"],
  "/courses": ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"],
  "/registrations": ["developer", "admin", "manager", "moderator", "sales", "finance"],
  "/leads": ["developer", "admin", "moderator", "marketer"],
  "/my-customers": ["developer", "admin", "manager", "sales"],
  "/distribution": ["developer", "admin", "manager", "moderator"],
  "/imports": ["developer", "admin", "moderator", "marketer"],
  "/tasks": ["developer", "admin", "manager", "sales"],
  "/deals": ["developer", "admin", "manager", "sales", "finance"],
  "/invoices": ["developer", "admin", "manager", "sales", "finance"],
  "/commissions": ["developer", "admin", "manager", "sales", "finance", "data_analyst"],
  "/companies": ["developer", "admin", "manager"],
  "/contacts": ["developer", "admin", "manager"],
  "/users": ["developer", "admin"],
  "/customize": ["developer", "admin"],
  "/settings": ["developer", "admin"],
};

export const permissionDefinitions: PermissionDefinition[] = [
  {
    role: "developer",
    labelAr: "مطور النظام",
    labelEn: "Developer",
    summaryAr: "يتحكم في النظام بالكامل: الإعدادات، الصلاحيات، الصفحات، البيانات، والتخصيص.",
    summaryEn: "Full technical control over settings, permissions, pages, data, and customization.",
    routes: Object.keys(routeAccess),
    actionsAr: ["تخصيص النظام", "إدارة الصلاحيات", "تعديل الحقول المحمية", "إدارة الصفحات"],
    actionsEn: ["Customize system", "Manage permissions", "Edit protected fields", "Manage pages"],
  },
  {
    role: "admin",
    labelAr: "المدير العام",
    labelEn: "General Manager",
    summaryAr: "يرى الصورة الكاملة ويدير التشغيل والتقارير والصلاحيات الأساسية.",
    summaryEn: "Sees the full picture and manages operations, reports, and core permissions.",
    routes: ["/dashboard", "/customers", "/training-centers", "/courses", "/registrations", "/distribution", "/imports", "/commissions", "/users", "/settings", "/customize"],
    actionsAr: ["إدارة المستخدمين", "توزيع العملاء", "مراجعة التسجيلات", "مراجعة الأداء"],
    actionsEn: ["Manage users", "Assign customers", "Review registrations", "Review performance"],
  },
  {
    role: "moderator",
    labelAr: "الموديريتور",
    labelEn: "Moderator",
    summaryAr: "يراجع العملاء الجدد، ينضف البيانات، ويوزع العملاء على فريق السيلز.",
    summaryEn: "Reviews new customers, cleans data, and assigns customers to sales.",
    routes: ["/dashboard", "/customers", "/leads", "/distribution", "/imports", "/registrations"],
    actionsAr: ["إضافة عملاء", "استيراد عملاء", "تنظيف البيانات", "توزيع العملاء"],
    actionsEn: ["Add customers", "Import customers", "Clean data", "Assign customers"],
  },
  {
    role: "marketer",
    labelAr: "المسوق",
    labelEn: "Marketer",
    summaryAr: "يدخل العملاء من الحملات ويدير المصدر والحملة والدورة المبدئية.",
    summaryEn: "Adds campaign leads and manages source, campaign, and initial course interest.",
    routes: ["/dashboard", "/customers", "/leads", "/imports", "/courses"],
    actionsAr: ["إضافة عملاء", "استيراد عملاء", "تحديد المصدر", "تجهيز العملاء للتوزيع"],
    actionsEn: ["Add customers", "Import customers", "Set source", "Prepare customers for assignment"],
  },
  {
    role: "manager",
    labelAr: "تيم ليدر سيلز",
    labelEn: "Sales Team Leader",
    summaryAr: "يتابع فريق السيلز، يرى العملاء الموزعين، ويساعد في التسجيلات والتقارير.",
    summaryEn: "Manages the sales team, assigned customers, registrations, and reports.",
    routes: ["/dashboard", "/customers", "/my-customers", "/distribution", "/registrations", "/commissions", "/courses"],
    actionsAr: ["متابعة الفريق", "إعادة توزيع العملاء", "مراجعة التسجيلات", "مراجعة العمولات"],
    actionsEn: ["Monitor team", "Reassign customers", "Review registrations", "Review commissions"],
  },
  {
    role: "sales",
    labelAr: "سيلز",
    labelEn: "Sales",
    summaryAr: "يتابع عملاءه، يسجل العملاء في الدورات، ويحدث حالة المتابعة.",
    summaryEn: "Follows assigned customers, registers them in courses, and updates follow-up status.",
    routes: ["/dashboard", "/customers", "/my-customers", "/registrations", "/tasks", "/commissions"],
    actionsAr: ["تحديث حالة العميل", "كتابة ملاحظات", "تحديد متابعة", "تسجيل عميل"],
    actionsEn: ["Update customer status", "Write notes", "Set follow-up", "Register customer"],
  },
  {
    role: "finance",
    labelAr: "مالية / حسابات",
    labelEn: "Finance",
    summaryAr: "يراجع المدفوعات، الخصومات، المتبقي، والعمولات.",
    summaryEn: "Reviews payments, discounts, remaining balances, and commissions.",
    routes: ["/dashboard", "/customers", "/registrations", "/invoices", "/commissions"],
    actionsAr: ["تحديث الدفع", "مراجعة الخصومات", "متابعة التحصيل", "مراجعة العمولات"],
    actionsEn: ["Update payment", "Review discounts", "Track collection", "Review commissions"],
  },
  {
    role: "data_analyst",
    labelAr: "محلل بيانات",
    labelEn: "Data Analyst",
    summaryAr: "يرى التقارير والتحليلات بدون صلاحيات تعديل تشغيلية أو مالية.",
    summaryEn: "Views reports and analytics without operational or finance editing permissions.",
    routes: ["/dashboard", "/customers", "/courses", "/commissions"],
    actionsAr: ["تحليل الأداء", "مراجعة التحويلات", "قراءة التقارير"],
    actionsEn: ["Analyze performance", "Review conversion", "Read reports"],
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
