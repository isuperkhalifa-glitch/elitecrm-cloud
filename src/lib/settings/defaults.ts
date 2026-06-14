export type SystemSetting = {
  key: string;
  label: string;
  group_name: string;
  value: unknown;
  description: string | null;
  is_public: boolean | null;
  updated_at?: string | null;
};

export const defaultSystemSettings: SystemSetting[] = [
  {
    key: "features.invoices.enabled",
    label: "تشغيل الفواتير",
    group_name: "features",
    value: true,
    description: "إظهار أو إخفاء الفواتير من النظام.",
    is_public: true,
  },
  {
    key: "features.commissions.enabled",
    label: "تشغيل العمولات",
    group_name: "features",
    value: true,
    description: "إظهار أو إخفاء العمولات من النظام.",
    is_public: true,
  },
  {
    key: "features.transfers.enabled",
    label: "تشغيل تحويل العملاء",
    group_name: "features",
    value: true,
    description: "السماح بتحويل العميل من سيلز إلى سيلز آخر.",
    is_public: true,
  },
  {
    key: "crm.lead_statuses",
    label: "حالات العملاء",
    group_name: "crm",
    value: ["new", "contacted", "qualified", "converted", "lost"],
    description: "الحالات الأساسية المستخدمة في صفحة العملاء.",
    is_public: true,
  },
  {
    key: "crm.customer_statuses",
    label: "حالات رحلة العميل",
    group_name: "crm",
    value: ["new", "assigned", "contacted", "interested", "follow_up", "not_interested", "no_answer", "wrong_number", "registered", "paid", "canceled"],
    description: "حالات رحلة العميل في مساحة عمل السيلز.",
    is_public: true,
  },
  {
    key: "crm.priorities",
    label: "الأولويات",
    group_name: "crm",
    value: ["low", "medium", "high", "urgent"],
    description: "أولويات العملاء والمهام.",
    is_public: true,
  },
  {
    key: "crm.payment_statuses",
    label: "حالات الدفع",
    group_name: "crm",
    value: ["unpaid", "partial", "paid", "refunded"],
    description: "حالات الدفع داخل رحلة التسجيل والفواتير.",
    is_public: true,
  },
  {
    key: "pages.dashboard.title",
    label: "عنوان لوحة التحكم",
    group_name: "pages",
    value: "لوحة التحكم",
    description: "عنوان صفحة لوحة التحكم.",
    is_public: true,
  },
  {
    key: "pages.dashboard.description",
    label: "وصف لوحة التحكم",
    group_name: "pages",
    value: "تابع العملاء والمتابعات والفواتير والعمولات حسب نطاق العرض.",
    description: "الوصف الظاهر في صفحة لوحة التحكم.",
    is_public: true,
  },
  {
    key: "pages.leads.title",
    label: "عنوان العملاء",
    group_name: "pages",
    value: "العملاء",
    description: "عنوان صفحة العملاء.",
    is_public: true,
  },
  {
    key: "pages.leads.description",
    label: "وصف العملاء",
    group_name: "pages",
    value: "إضافة وإدارة عملاء الدورات مع الحالة والأولوية ومصدر العميل.",
    description: "الوصف الظاهر في صفحة العملاء.",
    is_public: true,
  },
  {
    key: "pages.my-customers.title",
    label: "عنوان مساحة عمل السيلز",
    group_name: "pages",
    value: "عملائي",
    description: "عنوان صفحة متابعة العملاء للسيلز.",
    is_public: true,
  },
  {
    key: "pages.my-customers.description",
    label: "وصف عملائي",
    group_name: "pages",
    value: "مساحة متابعة العملاء للسيلز: ملاحظات، مواعيد متابعة، حالات، وتحويلات.",
    description: "الوصف الظاهر في صفحة عملائي.",
    is_public: true,
  },
  {
    key: "pages.distribution.title",
    label: "عنوان التوزيع",
    group_name: "pages",
    value: "توزيع العملاء",
    description: "عنوان صفحة توزيع العملاء.",
    is_public: true,
  },
  {
    key: "pages.distribution.description",
    label: "وصف التوزيع",
    group_name: "pages",
    value: "توزيع العملاء على فريق السيلز ومتابعة حالة التوزيع.",
    description: "الوصف الظاهر في صفحة توزيع العملاء.",
    is_public: true,
  },
  {
    key: "pages.invoices.title",
    label: "عنوان الفواتير",
    group_name: "pages",
    value: "الفواتير",
    description: "عنوان صفحة الفواتير.",
    is_public: true,
  },
  {
    key: "pages.commissions.title",
    label: "عنوان العمولات",
    group_name: "pages",
    value: "العمولات",
    description: "عنوان صفحة العمولات.",
    is_public: true,
  },
];

export function mergeSystemSettings(settings: SystemSetting[] = []) {
  const merged = new Map<string, SystemSetting>();

  for (const setting of defaultSystemSettings) merged.set(setting.key, setting);
  for (const setting of settings) merged.set(setting.key, setting);

  return Array.from(merged.values()).sort((a, b) => {
    const groupCompare = a.group_name.localeCompare(b.group_name);
    if (groupCompare !== 0) return groupCompare;
    return a.key.localeCompare(b.key);
  });
}

export function getSettingValue(
  settings: SystemSetting[],
  key: string,
  fallback: unknown = null
) {
  return settings.find((setting) => setting.key === key)?.value ?? fallback;
}
