export type OperatingRole =
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
