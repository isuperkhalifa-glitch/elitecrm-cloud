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

const salesOperations: AppRole[] = ["developer", "admin", "manager", "moderator", "sales"];
const reportingRoles: AppRole[] = ["developer", "admin", "manager", "finance", "data_analyst"];
const dataQualityRoles: AppRole[] = ["developer", "admin", "manager", "moderator", "data_analyst"];

export const routeAccess: Record<string, AppRole[]> = {
  "/dashboard": appRoles,
  "/calendar": salesOperations,
  "/requests": appRoles,
  "/calls": salesOperations,
  "/customers": appRoles,
  "/registrations": ["developer", "admin", "manager", "moderator", "sales", "finance"],
  "/training-centers": ["developer", "admin", "manager", "data_analyst"],
  "/courses": appRoles,
  "/distribution": ["developer", "admin", "manager", "moderator"],
  "/data-quality": dataQualityRoles,
  "/imports": ["developer", "admin", "moderator", "marketer"],
  "/commissions": ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  "/reports": reportingRoles,
  "/users": ["developer", "admin"],
  "/customize": ["developer", "admin"],
  "/settings": ["developer", "admin"],
  "/developer": ["developer"],
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
    routes: ["/dashboard", "/calendar", "/requests", "/calls", "/customers", "/registrations", "/training-centers", "/courses", "/distribution", "/data-quality", "/imports", "/commissions", "/reports", "/users", "/settings", "/customize", "/developer"],
    actionsAr: ["تخصيص النظام", "إدارة المستخدمين", "إدارة كل الطلبات", "إصلاح البيانات"],
    actionsEn: ["Customize system", "Manage users", "Manage all requests", "Fix data"],
  },
  {
    role: "admin",
    labelAr: "المدير العام",
    labelEn: "General Manager",
    summaryAr: "يرى كل شيء ويدير التشغيل والفريق.",
    summaryEn: "Full business visibility and operations management.",
    routes: ["/dashboard", "/calendar", "/requests", "/calls", "/customers", "/registrations", "/training-centers", "/courses", "/distribution", "/data-quality", "/imports", "/commissions", "/reports", "/users", "/settings"],
    actionsAr: ["متابعة الكل", "إدارة طلبات الفريق", "توزيع العملاء", "إدارة المستخدمين"],
    actionsEn: ["View all", "Manage team requests", "Assign customers", "Manage users"],
  },
  {
    role: "manager",
    labelAr: "تيم ليدر سيلز",
    labelEn: "Sales Team Leader",
    summaryAr: "يدير فريق السيلز والتوزيع والمتابعات والطلبات.",
    summaryEn: "Manages sales team, assignment, follow-ups, and requests.",
    routes: ["/dashboard", "/calendar", "/requests", "/calls", "/customers", "/registrations", "/distribution", "/data-quality", "/courses", "/commissions", "/reports"],
    actionsAr: ["إدارة طلبات الفريق", "توزيع العملاء", "تشغيل المكالمات", "متابعة الفريق"],
    actionsEn: ["Manage team requests", "Assign customers", "Run calls", "Monitor team"],
  },
  {
    role: "moderator",
    labelAr: "الموديريتور",
    labelEn: "Moderator",
    summaryAr: "يراجع العملاء ويوزعهم ويتعامل مع الطلبات الواردة والصادرة.",
    summaryEn: "Reviews customers, assigns them, and handles internal requests.",
    routes: ["/dashboard", "/calendar", "/requests", "/calls", "/customers", "/distribution", "/data-quality", "/imports"],
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "مراجعة العملاء", "التوزيع"],
    actionsEn: ["Assign request", "Complete requests", "Review customers", "Assign"],
  },
  {
    role: "marketer",
    labelAr: "المسوق",
    labelEn: "Marketer",
    summaryAr: "يضيف ويستورد العملاء ويتابع المصادر والطلبات الداخلية.",
    summaryEn: "Adds and imports customers, tracks sources, and handles requests.",
    routes: ["/dashboard", "/requests", "/customers", "/imports", "/courses"],
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "إضافة عملاء", "استيراد"],
    actionsEn: ["Assign request", "Complete requests", "Add customers", "Import"],
  },
  {
    role: "sales",
    labelAr: "سيلز",
    labelEn: "Sales",
    summaryAr: "يشغل قائمة اتصالاته ويتابع عملاءه وينفذ الطلبات المسندة إليه.",
    summaryEn: "Runs assigned calls, follows customers, and completes assigned requests.",
    routes: ["/dashboard", "/calendar", "/requests", "/calls", "/customers", "/registrations", "/commissions"],
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "تسجيل نتيجة المكالمة", "تسجيل العميل"],
    actionsEn: ["Assign request", "Complete requests", "Save call result", "Register customer"],
  },
  {
    role: "finance",
    labelAr: "مالية / حسابات",
    labelEn: "Finance",
    summaryAr: "يراجع المدفوعات والعمولات ويتعامل مع الطلبات الداخلية.",
    summaryEn: "Reviews payments and commissions and handles internal requests.",
    routes: ["/dashboard", "/requests", "/customers", "/registrations", "/commissions", "/reports"],
    actionsAr: ["إسناد طلب", "تنفيذ الطلبات", "تحديث الدفع", "مراجعة العمولات"],
    actionsEn: ["Assign request", "Complete requests", "Update payments", "Review commissions"],
  },
  {
    role: "data_analyst",
    labelAr: "محلل بيانات",
    labelEn: "Data Analyst",
    summaryAr: "يرى التقارير والطلبات بدون تعديل تشغيلي.",
    summaryEn: "Reads reports and requests without operational editing.",
    routes: ["/dashboard", "/requests", "/customers", "/data-quality", "/training-centers", "/courses", "/commissions", "/reports"],
    actionsAr: ["عرض الطلبات", "عرض التقارير", "تحليل الأداء"],
    actionsEn: ["View requests", "View reports", "Analyze performance"],
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
  const entry = Object.entries(routeAccess).find(
    ([route]) => pathname === route || pathname.startsWith(route + "/")
  );
  if (!entry) return true;
  return entry[1].includes(normalized);
}
