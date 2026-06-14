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
    key: "features.registrations.enabled",
    label: "تشغيل التسجيلات",
    group_name: "features",
    value: true,
    description: "إظهار صفحة التسجيلات المبسطة بدل الصفقات والفواتير.",
    is_public: true,
  },
  {
    key: "features.deals.enabled",
    label: "تشغيل الصفقات",
    group_name: "features",
    value: false,
    description: "إظهار أو إخفاء صفحة الصفقات من النظام.",
    is_public: true,
  },
  {
    key: "features.invoices.enabled",
    label: "تشغيل الفواتير",
    group_name: "features",
    value: false,
    description: "إظهار أو إخفاء الفواتير من النظام.",
    is_public: true,
  },
  {
    key: "features.commissions.enabled",
    label: "تشغيل العمولات",
    group_name: "features",
    value: false,
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
    value: ["interested", "not_interested", "need_offer", "missed", "wrong_number", "paid", "busy"],
    description: "الحالات الموحدة للعميل داخل النظام.",
    is_public: true,
  },
  {
    key: "crm.customer_statuses",
    label: "حالات رحلة العميل",
    group_name: "crm",
    value: ["interested", "not_interested", "need_offer", "missed", "wrong_number", "paid", "busy"],
    description: "نفس حالات العميل المستخدمة في مساحة عمل السيلز.",
    is_public: true,
  },
  {
    key: "crm.lead_types",
    label: "أنواع العملاء",
    group_name: "crm",
    value: ["fresh", "retargeted", "redirected"],
    description: "Fresh / Retargeted / Redirected.",
    is_public: true,
  },
  {
    key: "crm.country_codes",
    label: "أكواد الدول",
    group_name: "crm",
    value: ["+966", "+20", "+967", "+91", "+971", "+965", "+974", "+973", "+968"],
    description: "أكواد الدول المتاحة في إدخال رقم الجوال.",
    is_public: true,
  },
  {
    key: "crm.courses",
    label: "الدورات",
    group_name: "crm",
    value: ["pmp", "grcp", "power-bi-offline", "kpi", "pmp-offline", "rmp", "ai", "aphri", "social-media", "financial-management", "ai-offline", "excel", "power-bi", "cs", "capm", "english-club"],
    description: "قائمة الدورات المتاحة للاختيار مع العميل.",
    is_public: true,
  },
  {
    key: "crm.registration_statuses",
    label: "حالات التسجيل",
    group_name: "crm",
    value: ["not_registered", "registered", "canceled"],
    description: "حالات تسجيل العميل.",
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
    description: "حالات الدفع داخل رحلة التسجيل.",
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
    value: "تابع أداء العملاء والحملات وفريق السيلز من مكان واحد.",
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
    value: "إضافة وإدارة عملاء الدورات مع الحالة ونوع العميل والدورة.",
    description: "الوصف الظاهر في صفحة العملاء.",
    is_public: true,
  },
  {
    key: "pages.my-customers.title",
    label: "عنوان العملاء المهتمين",
    group_name: "pages",
    value: "العملاء المهتمون",
    description: "عنوان صفحة متابعة العملاء للسيلز.",
    is_public: true,
  },
  {
    key: "pages.my-customers.description",
    label: "وصف العملاء المهتمين",
    group_name: "pages",
    value: "مساحة متابعة السيلز: اتصال، واتساب، حالة العميل، الملاحظات، والمتابعة القادمة.",
    description: "الوصف الظاهر في صفحة العملاء المهتمين.",
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
    value: "توزيع العملاء على فريق السيلز بدون تأخير.",
    description: "الوصف الظاهر في صفحة توزيع العملاء.",
    is_public: true,
  },
  {
    key: "pages.registrations.title",
    label: "عنوان التسجيلات",
    group_name: "pages",
    value: "التسجيلات",
    description: "عنوان صفحة التسجيلات.",
    is_public: true,
  },
  {
    key: "pages.registrations.description",
    label: "وصف التسجيلات",
    group_name: "pages",
    value: "تابع العملاء المسجلين وحالة الدفع من صفحة واحدة بسيطة.",
    description: "الوصف الظاهر في صفحة التسجيلات.",
    is_public: true,
  },
  {
    key: "pages.tasks.title",
    label: "عنوان المهام",
    group_name: "pages",
    value: "المهام",
    description: "عنوان صفحة المهام.",
    is_public: true,
  },
  {
    key: "pages.tasks.description",
    label: "وصف المهام",
    group_name: "pages",
    value: "متابعة مهام السيلز والمواعيد القادمة حسب نطاق العرض.",
    description: "الوصف الظاهر في صفحة المهام.",
    is_public: true,
  },
  {
    key: "pages.imports.title",
    label: "عنوان الاستيراد",
    group_name: "pages",
    value: "استيراد العملاء",
    description: "عنوان صفحة استيراد العملاء.",
    is_public: true,
  },
  {
    key: "pages.imports.description",
    label: "وصف الاستيراد",
    group_name: "pages",
    value: "استيراد العملاء من ملفات Excel وتجهيزهم للتوزيع.",
    description: "الوصف الظاهر في صفحة الاستيراد.",
    is_public: true,
  },
  {
    key: "pages.companies.title",
    label: "عنوان الشركات",
    group_name: "pages",
    value: "الشركات",
    description: "عنوان صفحة الشركات.",
    is_public: true,
  },
  {
    key: "pages.companies.description",
    label: "وصف الشركات",
    group_name: "pages",
    value: "إدارة الشركات والجهات المرتبطة بالعملاء.",
    description: "الوصف الظاهر في صفحة الشركات.",
    is_public: true,
  },
  {
    key: "pages.contacts.title",
    label: "عنوان جهات الاتصال",
    group_name: "pages",
    value: "جهات الاتصال",
    description: "عنوان صفحة جهات الاتصال.",
    is_public: true,
  },
  {
    key: "pages.contacts.description",
    label: "وصف جهات الاتصال",
    group_name: "pages",
    value: "إدارة بيانات التواصل المرتبطة بالعملاء والشركات.",
    description: "الوصف الظاهر في صفحة جهات الاتصال.",
    is_public: true,
  },
  {
    key: "pages.users.title",
    label: "عنوان المستخدمين",
    group_name: "pages",
    value: "المستخدمون",
    description: "عنوان صفحة المستخدمين.",
    is_public: true,
  },
  {
    key: "pages.users.description",
    label: "وصف المستخدمين",
    group_name: "pages",
    value: "إدارة أعضاء الفريق والصلاحيات داخل النظام.",
    description: "الوصف الظاهر في صفحة المستخدمين.",
    is_public: true,
  },
  {
    key: "pages.settings.title",
    label: "عنوان الإعدادات",
    group_name: "pages",
    value: "مركز إعدادات النظام",
    description: "عنوان صفحة الإعدادات.",
    is_public: true,
  },
  {
    key: "pages.settings.description",
    label: "وصف الإعدادات",
    group_name: "pages",
    value: "تحكم مفصل في الصفحات والحالات والخصائص بدون كود.",
    description: "الوصف الظاهر في صفحة الإعدادات.",
    is_public: true,
  },
  {
    key: "pages.deals.title",
    label: "عنوان الصفقات",
    group_name: "pages",
    value: "الصفقات",
    description: "عنوان صفحة الصفقات.",
    is_public: true,
  },
  {
    key: "pages.deals.description",
    label: "وصف الصفقات",
    group_name: "pages",
    value: "صفحة اختيارية متوقفة افتراضيًا لتبسيط النظام.",
    description: "الوصف الظاهر في صفحة الصفقات.",
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
    key: "pages.invoices.description",
    label: "وصف الفواتير",
    group_name: "pages",
    value: "صفحة اختيارية متوقفة افتراضيًا لتبسيط النظام.",
    description: "الوصف الظاهر في صفحة الفواتير.",
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
  {
    key: "pages.commissions.description",
    label: "وصف العمولات",
    group_name: "pages",
    value: "متابعة عمولات السيلز المستحقة والمدفوعة.",
    description: "الوصف الظاهر في صفحة العمولات.",
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