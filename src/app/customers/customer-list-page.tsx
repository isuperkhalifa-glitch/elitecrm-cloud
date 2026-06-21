import { AppShell } from "@/components/app-shell";
import { getCurrentUserProfile } from "@/lib/auth/get-current-user-profile";
import { getEffectiveScope } from "@/lib/auth/effective-scope";
import { requirePageAccess } from "@/lib/auth/server-guards";
import { getEffectiveYear, yearDateRange } from "@/lib/filters/effective-year";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomersOperationsClient } from "./customers-operations-client";
import { getCustomerListConfig, type CustomerListView } from "./customer-list-config";
import {
  allowedConnections,
  allowedLeadTypes,
  allowedStages,
  allowedStatuses,
  dateRangeForFollowup,
  endOfDay,
  pageSizeOptions,
  parseCustomerFilters,
  safeNumber,
  startOfDay,
  uniqueText,
  validDate,
} from "./customer-operations-server";
import { withFixedCustomerFilters } from "./customer-operations-types";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  view: CustomerListView;
  searchParams?: Promise<SearchParams> | SearchParams;
};

export async function CustomerListPage({ view, searchParams }: Props) {
  const resolved = searchParams ? await searchParams : {};
  const config = getCustomerListConfig(view);
  const { user, profile } = await getCurrentUserProfile();
  const scope = await getEffectiveScope(profile?.role);
  const role = scope.effectiveRole;
  const scopedUserId = scope.scopedUserId;
  const scopedCompanyId = scope.scopedCompanyId;
  const selectedYear = await getEffectiveYear();
  const yearRange = yearDateRange(selectedYear);
  const admin = createAdminClient();
  requirePageAccess(role, "customers");

  const page = safeNumber(resolved.page, 1);
  const pageSizeInput = safeNumber(resolved.pageSize, 50);
  const pageSize = pageSizeOptions.includes(pageSizeInput) ? pageSizeInput : 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const filters = withFixedCustomerFilters(parseCustomerFilters(resolved), config.fixedFilters);

  const schemaProbe = await admin
    .from("leads")
    .select("connection_type,queue_type,redirected_date,city,education_level")
    .limit(1);
  const enhancedSchemaReady = !schemaProbe.error;

  let leadsQuery = admin
    .from("leads")
    .select("*", { count: "exact" })
    .gte("created_at", yearRange.from)
    .lt("created_at", yearRange.to)
    .order("next_follow_up_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (scopedUserId) leadsQuery = leadsQuery.eq("owner_id", scopedUserId);
  else if (role === "sales") leadsQuery = leadsQuery.eq("owner_id", user.id);
  if (scopedCompanyId) leadsQuery = leadsQuery.eq("company_id", scopedCompanyId);

  if (filters.q) {
    leadsQuery = leadsQuery.or(
      `full_name.ilike.%${filters.q}%,phone.ilike.%${filters.q}%,phone_number.ilike.%${filters.q}%,email.ilike.%${filters.q}%,program.ilike.%${filters.q}%,company_name.ilike.%${filters.q}%`
    );
  }
  if (allowedStatuses.has(filters.status)) {
    leadsQuery = leadsQuery.or(`status.eq.${filters.status},customer_status.eq.${filters.status}`);
  }
  if (allowedLeadTypes.has(filters.leadType)) leadsQuery = leadsQuery.eq("lead_type", filters.leadType);
  if (!scopedUserId && filters.owner && role !== "sales") leadsQuery = leadsQuery.eq("owner_id", filters.owner);
  if (filters.course) {
    leadsQuery = leadsQuery.or(`program.ilike.%${filters.course}%,course_name.ilike.%${filters.course}%`);
  }
  if (filters.source) leadsQuery = leadsQuery.eq("source", filters.source);

  const createdFrom = validDate(filters.createdFrom);
  const createdTo = validDate(filters.createdTo);
  if (createdFrom) leadsQuery = leadsQuery.gte("created_at", startOfDay(createdFrom).toISOString());
  if (createdTo) leadsQuery = leadsQuery.lte("created_at", endOfDay(createdTo).toISOString());

  const followupRange = dateRangeForFollowup(filters.followup, filters.startDate, filters.endDate);
  if (followupRange?.gte) leadsQuery = leadsQuery.gte("next_follow_up_at", followupRange.gte);
  if (followupRange?.lte) leadsQuery = leadsQuery.lte("next_follow_up_at", followupRange.lte);

  if (allowedConnections.has(filters.connection)) {
    if (filters.connection === "redirected") {
      leadsQuery = leadsQuery.not("redirected_date", "is", null);
    } else {
      // A row with an execution timestamp belongs only to the redirected bucket.
      leadsQuery = leadsQuery.is("redirected_date", null);

      if (filters.connection === "distributed") {
        if (enhancedSchemaReady) leadsQuery = leadsQuery.eq("connection_type", "distributed");
        else leadsQuery = leadsQuery.not("owner_id", "is", null);
      } else if (filters.connection === "ivr") {
        if (enhancedSchemaReady) leadsQuery = leadsQuery.or("connection_type.eq.ivr,source.ilike.%ivr%");
        else leadsQuery = leadsQuery.ilike("source", "%ivr%");
      } else if (filters.connection === "manual") {
        if (enhancedSchemaReady) leadsQuery = leadsQuery.or("connection_type.eq.manual,queue_type.eq.manual");
        else leadsQuery = leadsQuery.eq("queue_type", "manual");
      }
    }
  }

  if (enhancedSchemaReady && filters.city) leadsQuery = leadsQuery.eq("city", filters.city);
  if (enhancedSchemaReady && filters.education) leadsQuery = leadsQuery.eq("education_level", filters.education);

  if (allowedStages.has(filters.stage)) {
    if (filters.stage === "interested_without_deal") {
      leadsQuery = leadsQuery.or("status.eq.interested,customer_status.eq.interested");
      leadsQuery = leadsQuery.or("registration_status.is.null,registration_status.neq.registered");
      leadsQuery = leadsQuery.or("payment_status.is.null,payment_status.neq.paid");
    } else if (filters.stage === "with_deal") {
      leadsQuery = leadsQuery.or("registration_status.eq.registered,payment_status.eq.paid,payment_status.eq.partial");
    } else if (filters.stage === "still_in_sales") {
      leadsQuery = leadsQuery.or(
        "status.in.(interested,need_offer,busy,missed),customer_status.in.(interested,need_offer,busy,missed)"
      );
      leadsQuery = leadsQuery.or("payment_status.is.null,payment_status.neq.paid");
    } else {
      leadsQuery = leadsQuery.lt("next_follow_up_at", new Date().toISOString());
      leadsQuery = leadsQuery.or("payment_status.is.null,payment_status.neq.paid");
    }
  }

  let optionsQuery = admin
    .from("leads")
    .select(enhancedSchemaReady ? "source,city,education_level" : "source")
    .gte("created_at", yearRange.from)
    .lt("created_at", yearRange.to)
    .limit(5000);
  if (scopedUserId) optionsQuery = optionsQuery.eq("owner_id", scopedUserId);
  else if (role === "sales") optionsQuery = optionsQuery.eq("owner_id", user.id);
  if (scopedCompanyId) optionsQuery = optionsQuery.eq("company_id", scopedCompanyId);

  const [{ data: leads, count }, { data: profiles }, { data: courses }, { data: optionRows }] = await Promise.all([
    leadsQuery,
    admin
      .from("profiles")
      .select("id,full_name,email,role,is_active")
      .eq("is_active", true)
      .order("full_name"),
    admin.from("courses").select("id,name,name_ar,name_en,status").order("sort_order"),
    optionsQuery,
  ]);

  const rows = (optionRows ?? []) as unknown as Record<string, unknown>[];
  const courseOptions = (courses ?? []).map((course) => ({
    id: course.id,
    name: course.name_ar ?? course.name ?? course.name_en ?? course.id,
  }));

  return (
    <AppShell
      titleKey={config.titleKey}
      userEmail={user.email ?? null}
      fullName={profile?.full_name ?? null}
      role={profile?.role ?? null}
    >
      <CustomersOperationsClient
        initialLeads={(leads ?? []) as never[]}
        profiles={(profiles ?? []) as never[]}
        courses={courseOptions}
        sources={uniqueText(rows, "source")}
        cities={enhancedSchemaReady ? uniqueText(rows, "city") : []}
        educationLevels={enhancedSchemaReady ? uniqueText(rows, "education_level") : []}
        enhancedSchemaReady={enhancedSchemaReady}
        role={role}
        totalCount={count ?? 0}
        page={page}
        pageSize={pageSize}
        initialFilters={filters}
        titleAr={config.titleAr}
        titleEn={config.titleEn}
        descriptionAr={config.descriptionAr}
        descriptionEn={config.descriptionEn}
        fixedFilters={config.fixedFilters}
        lockedFields={config.lockedFields}
      />
    </AppShell>
  );
}
