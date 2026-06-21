export type CustomerLead = {
  id: string;
  customer_code?: string | null;
  full_name: string | null;
  phone?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email?: string | null;
  company_name?: string | null;
  source?: string | null;
  status?: string | null;
  customer_status?: string | null;
  owner_id?: string | null;
  program?: string | null;
  course_name?: string | null;
  course_id?: string | null;
  lead_type?: string | null;
  connection_type?: string | null;
  queue_type?: string | null;
  operation_status?: string | null;
  pending_operation_dist?: boolean | null;
  redirected_date?: string | null;
  city?: string | null;
  education_level?: string | null;
  next_follow_up_at?: string | null;
  registration_status?: string | null;
  payment_status?: string | null;
  created_at: string;
};

export type CustomerProfile = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

export type CustomerCourse = {
  id: string;
  name: string;
};

export type CustomerFilters = {
  q: string;
  status: string;
  owner: string;
  leadType: string;
  followup: string;
  startDate: string;
  endDate: string;
  course: string;
  source: string;
  connection: string;
  stage: string;
  city: string;
  education: string;
  createdFrom: string;
  createdTo: string;
};

export type CustomerOperationsProps = {
  initialLeads: CustomerLead[];
  profiles: CustomerProfile[];
  courses: CustomerCourse[];
  sources: string[];
  cities: string[];
  educationLevels: string[];
  enhancedSchemaReady: boolean;
  role: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  initialFilters: CustomerFilters;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  fixedFilters: Partial<CustomerFilters>;
  lockedFields: Array<keyof CustomerFilters>;
};

export const statusOptions = [
  "interested",
  "not_interested",
  "need_offer",
  "missed",
  "wrong_number",
  "paid",
  "busy",
];

// Redirected is determined by redirected_date and belongs to the connection
// bucket. It is intentionally not a lead_type value.
export const leadTypeOptions = ["fresh", "retargeted", "rejected"];

export const followupOptions = [
  { value: "", ar: "كل المتابعات", en: "All follow-ups" },
  { value: "overdue", ar: "متأخر", en: "Overdue" },
  { value: "today", ar: "اليوم", en: "Today" },
  { value: "tomorrow", ar: "غدًا", en: "Tomorrow" },
  { value: "3days", ar: "خلال 3 أيام", en: "Within 3 days" },
  { value: "7days", ar: "خلال 7 أيام", en: "Within 7 days" },
  { value: "month", ar: "خلال شهر", en: "Within a month" },
  { value: "custom", ar: "تاريخ مخصص", en: "Custom dates" },
];

export const stageOptions = [
  { value: "", ar: "كل مراحل البيع", en: "All sales stages" },
  { value: "interested_without_deal", ar: "مهتم بدون صفقة", en: "Interested without deal" },
  { value: "with_deal", ar: "تمت الصفقة", en: "With deal" },
  { value: "still_in_sales", ar: "ما زال في مرحلة البيع", en: "Still in sales stage" },
  { value: "missed_in_sales", ar: "متأخر في مرحلة البيع", en: "Missed in sales stage" },
];

export function emptyCustomerFilters(): CustomerFilters {
  return {
    q: "",
    status: "",
    owner: "",
    leadType: "",
    followup: "",
    startDate: "",
    endDate: "",
    course: "",
    source: "",
    connection: "",
    stage: "",
    city: "",
    education: "",
    createdFrom: "",
    createdTo: "",
  };
}

export function withFixedCustomerFilters(
  filters: CustomerFilters,
  fixedFilters: Partial<CustomerFilters>
): CustomerFilters {
  return { ...filters, ...fixedFilters };
}
