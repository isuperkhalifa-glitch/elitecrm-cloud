
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const write = (file, content) => {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), "utf8");
  console.log("wrote " + file);
};
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

write("src/lib/crm/operating-model.ts", `export type OperatingRole =
  | "developer"
  | "admin"
  | "moderator"
  | "marketer"
  | "manager"
  | "sales"
  | "finance"
  | "data_analyst";

export type WorkflowStage =
  | "lead_created"
  | "lead_reviewed"
  | "assigned_to_sales"
  | "contacted"
  | "registered"
  | "payment_review"
  | "paid"
  | "lost";

export type CoreModule =
  | "dashboard"
  | "training_centers"
  | "courses"
  | "customers"
  | "imports"
  | "distribution"
  | "registrations"
  | "payments"
  | "commissions"
  | "reports"
  | "users"
  | "settings"
  | "customize";

export const operatingRoleLabels: Record<OperatingRole, { ar: string; en: string }> = {
  developer: { ar: "مطور النظام", en: "Developer" },
  admin: { ar: "المدير العام", en: "General Manager" },
  moderator: { ar: "الموديريتور", en: "Moderator" },
  marketer: { ar: "المسوق", en: "Marketer" },
  manager: { ar: "تيم ليدر سيلز", en: "Sales Team Leader" },
  sales: { ar: "سيلز", en: "Sales" },
  finance: { ar: "مالية / حسابات", en: "Finance" },
  data_analyst: { ar: "محلل بيانات", en: "Data Analyst" },
};

export const workflowStages: Array<{ key: WorkflowStage; ar: string; en: string; owner: OperatingRole[] }> = [
  { key: "lead_created", ar: "إضافة العميل", en: "Lead created", owner: ["developer", "admin", "moderator", "marketer"] },
  { key: "lead_reviewed", ar: "مراجعة وتنظيف البيانات", en: "Review and clean data", owner: ["developer", "admin", "moderator"] },
  { key: "assigned_to_sales", ar: "توزيع على السيلز", en: "Assign to sales", owner: ["developer", "admin", "moderator", "manager"] },
  { key: "contacted", ar: "متابعة العميل", en: "Sales follow-up", owner: ["developer", "admin", "manager", "sales"] },
  { key: "registered", ar: "تسجيل في دورة", en: "Course registration", owner: ["developer", "admin", "manager", "sales", "finance"] },
  { key: "payment_review", ar: "مراجعة الدفع", en: "Payment review", owner: ["developer", "admin", "finance"] },
  { key: "paid", ar: "مدفوع ومكتمل", en: "Paid and completed", owner: ["developer", "admin", "finance"] },
  { key: "lost", ar: "مغلق / غير مهتم", en: "Closed / lost", owner: ["developer", "admin", "manager", "sales", "moderator"] },
];

export const moduleAccess: Record<CoreModule, OperatingRole[]> = {
  dashboard: ["developer", "admin", "moderator", "marketer", "manager", "sales", "finance", "data_analyst"],
  training_centers: ["developer", "admin", "manager"],
  courses: ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"],
  customers: ["developer", "admin", "moderator", "marketer", "manager", "sales", "finance", "data_analyst"],
  imports: ["developer", "admin", "moderator", "marketer"],
  distribution: ["developer", "admin", "moderator", "manager"],
  registrations: ["developer", "admin", "manager", "moderator", "sales", "finance"],
  payments: ["developer", "admin", "finance"],
  commissions: ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  reports: ["developer", "admin", "manager", "finance", "data_analyst"],
  users: ["developer", "admin"],
  settings: ["developer", "admin"],
  customize: ["developer", "admin"],
};

export const fieldPermissions = {
  customerIdentity: ["developer", "admin", "moderator", "marketer"],
  marketingSource: ["developer", "admin", "moderator", "marketer"],
  assignment: ["developer", "admin", "moderator", "manager"],
  salesFollowup: ["developer", "admin", "manager", "sales"],
  registration: ["developer", "admin", "manager", "sales", "finance"],
  payment: ["developer", "admin", "finance"],
  protectedAdmin: ["developer", "admin"],
  analysis: ["developer", "admin", "manager", "finance", "data_analyst"],
} satisfies Record<string, OperatingRole[]>;

export function roleCan(role: string | null | undefined, allowed: OperatingRole[]) {
  return allowed.includes(normalizeOperatingRole(role));
}

export function normalizeOperatingRole(role?: string | null): OperatingRole {
  if (role === "developer") return "developer";
  if (role === "admin") return "admin";
  if (role === "moderator") return "moderator";
  if (role === "marketer") return "marketer";
  if (role === "manager") return "manager";
  if (role === "finance") return "finance";
  if (role === "data_analyst") return "data_analyst";
  return "sales";
}
`);

write("src/lib/auth/roles.ts", `export type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";

export type PageKey =
  | "dashboard"
  | "customers"
  | "courses"
  | "training-centers"
  | "registrations"
  | "my-customers"
  | "leads"
  | "tasks"
  | "deals"
  | "invoices"
  | "commissions"
  | "distribution"
  | "imports"
  | "companies"
  | "contacts"
  | "users"
  | "settings"
  | "customize";

export const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];

export const pageAccess: Record<PageKey, Role[]> = {
  dashboard: allRoles,
  customers: allRoles,
  courses: ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"],
  "training-centers": ["developer", "admin", "manager"],
  registrations: ["developer", "admin", "manager", "moderator", "sales", "finance"],
  "my-customers": ["developer", "admin", "manager", "sales"],
  leads: ["developer", "admin", "moderator", "marketer"],
  tasks: ["developer", "admin", "manager", "sales"],
  deals: ["developer", "admin", "manager", "sales"],
  invoices: ["developer", "admin", "manager", "finance", "sales"],
  commissions: ["developer", "admin", "manager", "finance", "sales", "data_analyst"],
  distribution: ["developer", "admin", "manager", "moderator"],
  imports: ["developer", "admin", "moderator", "marketer"],
  companies: ["developer", "admin", "manager"],
  contacts: ["developer", "admin", "manager"],
  users: ["developer", "admin"],
  settings: ["developer", "admin"],
  customize: ["developer", "admin"],
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
`);

write("src/lib/auth/permissions.ts", `export type AppRole = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";

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
`);

let appShellPath = "src/components/app-shell.tsx";
if (exists(appShellPath)) {
  let appShell = read(appShellPath);
  appShell = appShell.replace(
    'type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance";',
    'type Role = "developer" | "admin" | "manager" | "moderator" | "marketer" | "sales" | "finance" | "data_analyst";'
  );
  appShell = appShell.replace(
    'const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance"];',
    'const allRoles: Role[] = ["developer", "admin", "manager", "moderator", "marketer", "sales", "finance", "data_analyst"];'
  );
  if (!appShell.includes('role === "data_analyst"')) {
    appShell = appShell.replace('if (role === "finance") return "finance";', 'if (role === "finance") return "finance";\n  if (role === "data_analyst") return "data_analyst";');
  }
  const roleNameBlock = `function roleName(role: Role, isArabic: boolean) {
  const labels: Record<Role, { ar: string; en: string }> = {
    developer: { ar: "مطور النظام", en: "Developer" },
    admin: { ar: "المدير العام", en: "General Manager" },
    manager: { ar: "تيم ليدر سيلز", en: "Sales Team Leader" },
    moderator: { ar: "الموديريتور", en: "Moderator" },
    marketer: { ar: "المسوق", en: "Marketer" },
    sales: { ar: "سيلز", en: "Sales" },
    finance: { ar: "مالية / حسابات", en: "Finance" },
    data_analyst: { ar: "محلل بيانات", en: "Data Analyst" },
  };

  return isArabic ? labels[role].ar : labels[role].en;
}`;
  appShell = appShell.replace(/function roleName\(role: Role, isArabic: boolean\) \{[\s\S]*?\n\}\n\nexport function AppShell/, roleNameBlock + "\n\nexport function AppShell");
  if (!appShell.includes('href: "/registrations"')) {
    appShell = appShell.replace(
      '{ href: "/customers", labelKey: "customers", icon: UsersRound, roles: allRoles },',
      '{ href: "/customers", labelKey: "customers", icon: UsersRound, roles: allRoles },\n      { href: "/registrations", labelKey: "registrations", icon: Receipt, roles: ["developer", "admin", "manager", "moderator", "sales", "finance"] },'
    );
  }
  fs.writeFileSync(path.join(root, appShellPath), appShell, "utf8");
  console.log("patched " + appShellPath);
}

let customerPagePath = "src/app/customers/[id]/page.tsx";
if (exists(customerPagePath)) {
  let page = read(customerPagePath);
  page = page
    .replaceAll("ط§ظ„ط¹ظ…ظٹظ„ ط؛ظٹط± ظ…ظˆط¬ظˆط¯.", "العميل غير موجود.")
    .replaceAll("ظ‡ط°ط§ ط§ظ„ط¹ظ…ظٹظ„ ط؛ظٹط± ظ…طھط§ط­ ظ„طµظ„ط§ط­ظٹطھظƒ ط§ظ„ط­ط§ظ„ظٹط©.", "هذا العميل غير متاح لصلاحيتك الحالية.")
    .replaceAll('"ط§ظ„ظ†ط¸ط§ظ…"', '"النظام"');
  fs.writeFileSync(path.join(root, customerPagePath), page, "utf8");
  console.log("patched " + customerPagePath);
}

write("database/v6_operating_model.sql", `-- EliteCRM V6.0 Operating Model Foundation
-- Run manually in Supabase SQL Editor after this patch is deployed.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('developer','admin','manager','moderator','marketer','sales','finance','data_analyst'));

alter table public.leads add column if not exists campaign_name text;
alter table public.leads add column if not exists intake_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.leads add column if not exists reviewed_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.leads add column if not exists reviewed_at timestamptz;
alter table public.leads add column if not exists assigned_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.leads add column if not exists workflow_stage text not null default 'lead_created';

alter table public.registrations add column if not exists created_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.registrations add column if not exists updated_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.registrations add column if not exists finance_reviewed_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.registrations add column if not exists finance_reviewed_at timestamptz;
alter table public.registrations add column if not exists payment_method text;
alter table public.registrations add column if not exists payment_reference text;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on update cascade on delete cascade,
  lead_id uuid references public.leads(id) on update cascade on delete cascade,
  company_id uuid references public.companies(id) on update cascade on delete set null,
  course_id text references public.courses(id) on update cascade on delete set null,
  amount numeric(12,2) not null default 0,
  payment_method text,
  payment_reference text,
  status text not null default 'pending',
  paid_at timestamptz,
  reviewed_by uuid references public.profiles(id) on update cascade on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_workflow_stage_idx on public.leads(workflow_stage);
create index if not exists leads_campaign_name_idx on public.leads(campaign_name);
create index if not exists payments_registration_id_idx on public.payments(registration_id);
create index if not exists payments_lead_id_idx on public.payments(lead_id);
create index if not exists payments_company_id_idx on public.payments(company_id);
create index if not exists payments_status_idx on public.payments(status);

alter table public.payments enable row level security;

drop policy if exists payments_all_authenticated on public.payments;
create policy payments_all_authenticated on public.payments for all to authenticated using (true) with check (true);
`);

console.log("V6.0 operating model foundation patch finished.");
