import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  Code2,
  FileSpreadsheet,
  GraduationCap,
  Headphones,
  Inbox,
  PhoneCall,
  Receipt,
  Send,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type Role =
  | "developer"
  | "admin"
  | "manager"
  | "moderator"
  | "marketer"
  | "sales"
  | "finance"
  | "data_analyst";

export type NavItem = {
  href?: string;
  key?: string;
  ar: string;
  en: string;
  icon: LucideIcon;
  roles: Role[];
  children?: NavItem[];
};

export type NavGroup = {
  key: string;
  ar: string;
  en: string;
  icon: LucideIcon;
  roles: Role[];
  items: NavItem[];
};

export const allRoles: Role[] = [
  "developer",
  "admin",
  "manager",
  "moderator",
  "marketer",
  "sales",
  "finance",
  "data_analyst",
];

const requestCreateRoles: Role[] = [
  "developer",
  "admin",
  "manager",
  "moderator",
  "marketer",
  "sales",
  "finance",
];
const adminRoles: Role[] = ["developer", "admin"];
const salesOpsRoles: Role[] = ["developer", "admin", "manager", "moderator", "sales"];
const reportingRoles: Role[] = ["developer", "admin", "manager", "finance", "data_analyst"];
const dataQualityRoles: Role[] = ["developer", "admin", "manager", "moderator", "data_analyst"];

const callChildren: NavItem[] = [
  { href: "/calls?filter=all", ar: "كل المكالمات", en: "All calls", icon: PhoneCall, roles: salesOpsRoles },
  { href: "/calls?filter=deadline_today", ar: "موعدها اليوم", en: "Deadline today", icon: PhoneCall, roles: salesOpsRoles },
  { href: "/calls?filter=interested", ar: "المهتمون", en: "Interested", icon: PhoneCall, roles: salesOpsRoles },
  { href: "/calls?filter=ivr", ar: "مكالمات الرد الآلي", en: "IVR calls", icon: PhoneCall, roles: salesOpsRoles },
  { href: "/calls?filter=missed", ar: "المكالمات الفائتة", en: "Missed calls", icon: PhoneCall, roles: salesOpsRoles },
  { href: "/calls?filter=received_today", ar: "المستلمة اليوم", en: "Received today", icon: PhoneCall, roles: salesOpsRoles },
  { href: "/calls?filter=redirected", ar: "المحوّلة إليك", en: "Redirected to you", icon: PhoneCall, roles: salesOpsRoles },
];

export const navGroups: NavGroup[] = [
  {
    key: "requests",
    ar: "الطلبات",
    en: "Requests",
    icon: ClipboardList,
    roles: allRoles,
    items: [
      { href: "/requests?tab=assign", ar: "إسناد طلب", en: "Assign request", icon: Send, roles: requestCreateRoles },
      { href: "/requests?tab=incoming", ar: "الطلبات الواردة", en: "Incoming requests", icon: Inbox, roles: allRoles },
      { href: "/requests?tab=outgoing", ar: "الطلبات الصادرة", en: "Outgoing requests", icon: Send, roles: allRoles },
      { href: "/requests?tab=team", ar: "طلبات الفريق", en: "Team requests", icon: UsersRound, roles: ["developer", "admin", "manager"] },
    ],
  },
  {
    key: "customers",
    ar: "العملاء",
    en: "Customers",
    icon: UsersRound,
    roles: allRoles,
    items: [
      { href: "/customers", ar: "كل العملاء", en: "All customers", icon: UsersRound, roles: allRoles },
      { href: "/distribution", ar: "مركز التوزيع", en: "Distribution center", icon: FileSpreadsheet, roles: ["developer", "admin", "manager", "moderator"] },
      { href: "/data-quality", ar: "جودة البيانات", en: "Data quality", icon: ShieldCheck, roles: dataQualityRoles },
      { href: "/imports", ar: "استيراد العملاء", en: "Import customers", icon: FileSpreadsheet, roles: ["developer", "admin", "moderator", "marketer"] },
    ],
  },
  {
    key: "sales",
    ar: "المبيعات",
    en: "Sales",
    icon: Receipt,
    roles: salesOpsRoles,
    items: [
      { key: "calls", ar: "المكالمات", en: "Calls", icon: Headphones, roles: salesOpsRoles, children: callChildren },
      { href: "/registrations", ar: "التسجيلات والمدفوعات", en: "Registrations & payments", icon: Receipt, roles: [...salesOpsRoles, "finance", "data_analyst"] },
      { href: "/commissions", ar: "العمولات", en: "Commissions", icon: BarChart3, roles: ["developer", "admin", "manager", "sales", "finance", "data_analyst"] },
    ],
  },
  {
    key: "academy",
    ar: "الأكاديمية",
    en: "Academy",
    icon: GraduationCap,
    roles: allRoles,
    items: [
      { href: "/training-centers", ar: "مراكز التدريب", en: "Training centers", icon: Building2, roles: ["developer", "admin", "manager", "data_analyst"] },
      { href: "/courses", ar: "الدورات", en: "Courses", icon: BookOpen, roles: allRoles },
    ],
  },
  {
    key: "reports",
    ar: "التقارير",
    en: "Reports",
    icon: BarChart3,
    roles: reportingRoles,
    items: [
      { href: "/reports", ar: "تقارير الأداء", en: "Performance reports", icon: BarChart3, roles: reportingRoles },
    ],
  },
  {
    key: "system",
    ar: "النظام",
    en: "System",
    icon: Settings,
    roles: adminRoles,
    items: [
      { href: "/users", ar: "المستخدمون والصلاحيات", en: "Users & roles", icon: UserCog, roles: adminRoles },
      { href: "/settings", ar: "الإعدادات", en: "Settings", icon: Settings, roles: adminRoles },
      { href: "/customize", ar: "تخصيص النظام", en: "Customize", icon: ShieldCheck, roles: adminRoles },
      { href: "/developer", ar: "مركز المطور", en: "Developer center", icon: Code2, roles: ["developer"] },
    ],
  },
];

export const pageTitles: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  calendar: { ar: "التقويم والمتابعات", en: "Calendar & follow-ups" },
  requests: { ar: "مركز الطلبات الداخلية", en: "Internal requests center" },
  calls: { ar: "المكالمات الواردة", en: "Incoming calls" },
  customers: { ar: "العملاء", en: "Customers" },
  registrations: { ar: "التسجيلات والمدفوعات", en: "Registrations & payments" },
  courses: { ar: "الدورات", en: "Courses" },
  trainingCenters: { ar: "مراكز التدريب", en: "Training centers" },
  imports: { ar: "استيراد العملاء", en: "Import customers" },
  distribution: { ar: "مركز التوزيع", en: "Distribution center" },
  dataQuality: { ar: "جودة البيانات", en: "Data quality" },
  commissions: { ar: "العمولات", en: "Commissions" },
  reports: { ar: "تقارير الأداء", en: "Performance reports" },
  users: { ar: "المستخدمون والصلاحيات", en: "Users & roles" },
  settings: { ar: "الإعدادات", en: "Settings" },
  customize: { ar: "تخصيص النظام", en: "Customize" },
  developer: { ar: "مركز المطور", en: "Developer center" },
};

export function normalizeRole(value?: string | null): Role {
  if (value === "developer") return "developer";
  if (value === "admin") return "admin";
  if (value === "manager") return "manager";
  if (value === "moderator") return "moderator";
  if (value === "marketer") return "marketer";
  if (value === "finance") return "finance";
  if (value === "data_analyst") return "data_analyst";
  return "sales";
}

export function roleLabel(role: Role, isArabic: boolean) {
  const labels: Record<Role, { ar: string; en: string }> = {
    developer: { ar: "مطور النظام", en: "Developer" },
    admin: { ar: "المدير العام", en: "General manager" },
    manager: { ar: "تيم ليدر سيلز", en: "Sales team leader" },
    moderator: { ar: "الموديريتور", en: "Moderator" },
    marketer: { ar: "المسوق", en: "Marketer" },
    sales: { ar: "سيلز", en: "Sales" },
    finance: { ar: "مالية / حسابات", en: "Finance" },
    data_analyst: { ar: "محلل بيانات", en: "Data analyst" },
  };
  return isArabic ? labels[role].ar : labels[role].en;
}

export function routePath(href?: string) {
  return (href ?? "").split("?")[0];
}
