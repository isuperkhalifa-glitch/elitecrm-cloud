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
import {
  adminRoles,
  appRoles,
  dataQualityRoles,
  normalizeRole as normalizePermissionRole,
  reportingRoles,
  requestCreateRoles,
  routeAccess,
  salesOperationsRoles,
  type AppRole,
} from "@/lib/auth/permissions";

export type Role = AppRole;

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

export const allRoles = appRoles;
const salesOpsRoles = salesOperationsRoles;

const callChildren: NavItem[] = [
  { href: "/calls?filter=all", ar: "كل المكالمات", en: "All calls", icon: PhoneCall, roles: routeAccess["/calls"] },
  { href: "/calls?filter=deadline_today", ar: "موعدها اليوم", en: "Deadline today", icon: PhoneCall, roles: routeAccess["/calls"] },
  { href: "/calls?filter=interested", ar: "المهتمون", en: "Interested", icon: PhoneCall, roles: routeAccess["/calls"] },
  { href: "/calls?filter=ivr", ar: "مكالمات الرد الآلي", en: "IVR calls", icon: PhoneCall, roles: routeAccess["/calls"] },
  { href: "/calls?filter=missed", ar: "المكالمات الفائتة", en: "Missed calls", icon: PhoneCall, roles: routeAccess["/calls"] },
  { href: "/calls?filter=received_today", ar: "المستلمة اليوم", en: "Received today", icon: PhoneCall, roles: routeAccess["/calls"] },
  { href: "/calls?filter=redirected", ar: "المحوّلة إليك", en: "Redirected to you", icon: PhoneCall, roles: routeAccess["/calls"] },
];

const customerViewChildren: NavItem[] = [
  { href: "/customers/all", ar: "كل العملاء", en: "All customers", icon: UsersRound, roles: routeAccess["/customers"] },
  { href: "/customers/assigned", ar: "العملاء الموزعون", en: "Distributed customers", icon: UsersRound, roles: routeAccess["/customers"] },
  { href: "/customers/ivr", ar: "عملاء الرد الآلي", en: "IVR customers", icon: UsersRound, roles: routeAccess["/customers"] },
  { href: "/customers/manual", ar: "الإدخال اليدوي", en: "Manual entry", icon: UsersRound, roles: routeAccess["/customers"] },
  { href: "/customers/redirected", ar: "العملاء المحوّلون", en: "Redirected customers", icon: UsersRound, roles: routeAccess["/customers"] },
  { href: "/customers/interested", ar: "مهتمون بدون تسجيل", en: "Interested without registration", icon: UsersRound, roles: routeAccess["/customers"] },
  { href: "/customers/overdue", ar: "متابعات متأخرة", en: "Overdue follow-ups", icon: UsersRound, roles: routeAccess["/customers"] },
];

const reportChildren: NavItem[] = [
  { href: "/reports?tab=sources", ar: "مصادر البيانات", en: "Data sources", icon: BarChart3, roles: routeAccess["/reports"] },
  { href: "/reports?tab=distribution", ar: "توزيع البيانات", en: "Data distribution", icon: BarChart3, roles: routeAccess["/reports"] },
  { href: "/reports?tab=tasks", ar: "المهام المكتملة", en: "Completed tasks", icon: BarChart3, roles: routeAccess["/reports"] },
];

export const navGroups: NavGroup[] = [
  {
    key: "students",
    ar: "الطلاب والتسجيلات",
    en: "Students & registrations",
    icon: GraduationCap,
    roles: routeAccess["/registrations"],
    items: [
      {
        href: "/registrations",
        ar: "التسجيلات والمدفوعات",
        en: "Registrations & payments",
        icon: Receipt,
        roles: routeAccess["/registrations"],
      },
    ],
  },
  {
    key: "requests",
    ar: "الطلبات",
    en: "Requests",
    icon: ClipboardList,
    roles: routeAccess["/requests"],
    items: [
      { href: "/requests?tab=assign", ar: "إسناد طلب", en: "Assign request", icon: Send, roles: requestCreateRoles },
      { href: "/requests?tab=incoming", ar: "الطلبات الواردة", en: "Incoming requests", icon: Inbox, roles: routeAccess["/requests"] },
      { href: "/requests?tab=outgoing", ar: "الطلبات الصادرة", en: "Outgoing requests", icon: Send, roles: routeAccess["/requests"] },
      { href: "/requests?tab=team", ar: "طلبات الفريق", en: "Team requests", icon: UsersRound, roles: ["developer", "admin", "manager"] },
    ],
  },
  {
    key: "sales",
    ar: "المبيعات والتشغيل",
    en: "Sales operations",
    icon: Receipt,
    roles: allRoles,
    items: [
      { key: "calls", ar: "مركز المكالمات", en: "Calls center", icon: Headphones, roles: routeAccess["/calls"], children: callChildren },
      { href: "/distribution", ar: "التوزيع والطوابير", en: "Distribution & queues", icon: FileSpreadsheet, roles: routeAccess["/distribution"] },
      { href: "/data-quality", ar: "فحص وجودة العملاء", en: "Customer checks & quality", icon: ShieldCheck, roles: dataQualityRoles },
      { href: "/imports", ar: "استيراد البيانات", en: "Data imports", icon: FileSpreadsheet, roles: routeAccess["/imports"] },
      { href: "/commissions", ar: "العمولات", en: "Commissions", icon: BarChart3, roles: routeAccess["/commissions"] },
    ],
  },
  {
    key: "customers",
    ar: "العملاء",
    en: "Customers",
    icon: UsersRound,
    roles: routeAccess["/customers"],
    items: [
      { key: "customerViews", ar: "قوائم العملاء", en: "Customer lists", icon: UsersRound, roles: routeAccess["/customers"], children: customerViewChildren },
      { href: "/distribution", ar: "نقل وإعادة توزيع العملاء", en: "Transfer & redistribute", icon: Send, roles: routeAccess["/distribution"] },
    ],
  },
  {
    key: "academy",
    ar: "الأكاديمية",
    en: "Academy",
    icon: GraduationCap,
    roles: allRoles,
    items: [
      { href: "/training-centers", ar: "مراكز التدريب", en: "Training centers", icon: Building2, roles: routeAccess["/training-centers"] },
      { href: "/courses", ar: "الدورات", en: "Courses", icon: BookOpen, roles: routeAccess["/courses"] },
    ],
  },
  {
    key: "reports",
    ar: "التقارير",
    en: "Reports",
    icon: BarChart3,
    roles: reportingRoles,
    items: [
      { key: "reportViews", ar: "مركز التقارير", en: "Reports center", icon: BarChart3, roles: routeAccess["/reports"], children: reportChildren },
    ],
  },
  {
    key: "system",
    ar: "النظام",
    en: "System",
    icon: Settings,
    roles: adminRoles,
    items: [
      { href: "/users", ar: "المستخدمون والصلاحيات", en: "Users & roles", icon: UserCog, roles: routeAccess["/users"] },
      { href: "/settings", ar: "الإعدادات", en: "Settings", icon: Settings, roles: routeAccess["/settings"] },
      { href: "/customize", ar: "تخصيص النظام", en: "Customize", icon: ShieldCheck, roles: routeAccess["/customize"] },
      { href: "/developer", ar: "مركز المطور", en: "Developer center", icon: Code2, roles: routeAccess["/developer"] },
    ],
  },
];

export const pageTitles: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  calendar: { ar: "التقويم والمتابعات", en: "Calendar & follow-ups" },
  requests: { ar: "مركز الطلبات الداخلية", en: "Internal requests center" },
  calls: { ar: "مركز المكالمات", en: "Calls center" },
  customers: { ar: "مركز العملاء", en: "Customer center" },
  customersAll: { ar: "كل العملاء", en: "All customers" },
  customersDistributed: { ar: "العملاء الموزعون", en: "Distributed customers" },
  customersIvr: { ar: "عملاء الرد الآلي", en: "IVR customers" },
  customersManual: { ar: "الإدخال اليدوي", en: "Manual entry" },
  customersRedirected: { ar: "العملاء المحوّلون", en: "Redirected customers" },
  customersInterested: { ar: "مهتمون بدون تسجيل", en: "Interested without registration" },
  customersOverdue: { ar: "المتابعات المتأخرة", en: "Overdue follow-ups" },
  registrations: { ar: "الطلاب والتسجيلات", en: "Students & registrations" },
  courses: { ar: "الدورات", en: "Courses" },
  trainingCenters: { ar: "مراكز التدريب", en: "Training centers" },
  imports: { ar: "استيراد البيانات", en: "Data imports" },
  distribution: { ar: "التوزيع والطوابير", en: "Distribution & queues" },
  dataQuality: { ar: "فحص وجودة العملاء", en: "Customer checks & quality" },
  commissions: { ar: "العمولات", en: "Commissions" },
  reports: { ar: "مركز التقارير", en: "Reports center" },
  users: { ar: "المستخدمون والصلاحيات", en: "Users & roles" },
  settings: { ar: "الإعدادات", en: "Settings" },
  customize: { ar: "تخصيص النظام", en: "Customize" },
  developer: { ar: "مركز المطور", en: "Developer center" },
};

export function normalizeRole(value?: string | null): Role {
  return normalizePermissionRole(value);
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
