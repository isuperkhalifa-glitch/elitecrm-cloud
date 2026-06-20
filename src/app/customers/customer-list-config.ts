import type { CustomerFilters } from "./customer-operations-types";

export type CustomerListView =
  | "all"
  | "distributed"
  | "ivr"
  | "manual"
  | "redirected"
  | "interested-without-registration"
  | "overdue-followups";

export type CustomerListConfig = {
  key: CustomerListView;
  titleKey: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  fixedFilters: Partial<CustomerFilters>;
  lockedFields: Array<keyof CustomerFilters>;
};

export const customerListConfigs: Record<CustomerListView, CustomerListConfig> = {
  all: {
    key: "all",
    titleKey: "customersAll",
    titleAr: "كل العملاء",
    titleEn: "All customers",
    descriptionAr: "قاعدة العملاء الكاملة مع البحث والتصفية والتحويل الجماعي.",
    descriptionEn: "The complete customer database with search, filters, and bulk transfer.",
    fixedFilters: {},
    lockedFields: [],
  },
  distributed: {
    key: "distributed",
    titleKey: "customersDistributed",
    titleAr: "العملاء الموزعون",
    titleEn: "Distributed customers",
    descriptionAr: "العملاء الذين تم إسنادهم إلى موظفي المبيعات مع متابعة المسؤول الحالي.",
    descriptionEn: "Customers assigned to sales users with current-owner tracking.",
    fixedFilters: { connection: "distributed" },
    lockedFields: ["connection"],
  },
  ivr: {
    key: "ivr",
    titleKey: "customersIvr",
    titleAr: "عملاء الرد الآلي",
    titleEn: "IVR customers",
    descriptionAr: "العملاء الواردون من نظام الرد الآلي وقنوات الاتصال المرتبطة به.",
    descriptionEn: "Customers received through IVR and related calling channels.",
    fixedFilters: { connection: "ivr" },
    lockedFields: ["connection"],
  },
  manual: {
    key: "manual",
    titleKey: "customersManual",
    titleAr: "عملاء الإدخال اليدوي",
    titleEn: "Manual customers",
    descriptionAr: "العملاء الذين تمت إضافتهم يدويًا بواسطة فريق العمل.",
    descriptionEn: "Customers added manually by the team.",
    fixedFilters: { connection: "manual" },
    lockedFields: ["connection"],
  },
  redirected: {
    key: "redirected",
    titleKey: "customersRedirected",
    titleAr: "العملاء المحوّلون",
    titleEn: "Redirected customers",
    descriptionAr: "العملاء المحوّلون بين الموظفين أو القنوات مع متابعة المسؤول الحالي.",
    descriptionEn: "Customers redirected between users or channels with owner tracking.",
    fixedFilters: { connection: "redirected" },
    lockedFields: ["connection"],
  },
  "interested-without-registration": {
    key: "interested-without-registration",
    titleKey: "customersInterested",
    titleAr: "مهتمون بدون تسجيل",
    titleEn: "Interested without registration",
    descriptionAr: "العملاء المهتمون الذين لم يتحولوا إلى تسجيل أو دفعة حتى الآن.",
    descriptionEn: "Interested customers who have not converted into a registration or payment yet.",
    fixedFilters: { stage: "interested_without_deal" },
    lockedFields: ["stage"],
  },
  "overdue-followups": {
    key: "overdue-followups",
    titleKey: "customersOverdue",
    titleAr: "المتابعات المتأخرة",
    titleEn: "Overdue follow-ups",
    descriptionAr: "العملاء الذين تجاوزوا موعد المتابعة ويحتاجون إجراءً سريعًا.",
    descriptionEn: "Customers whose follow-up deadline has passed and need immediate action.",
    fixedFilters: { followup: "overdue" },
    lockedFields: ["followup"],
  },
};

export function getCustomerListConfig(view: CustomerListView) {
  return customerListConfigs[view];
}
