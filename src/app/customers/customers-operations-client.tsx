"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2, Send, UsersRound, XCircle } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { CustomerOperationsFilters } from "./customer-operations-filters";
import { CustomerOperationsTable } from "./customer-operations-table";
import {
  emptyCustomerFilters,
  type CustomerFilters,
  type CustomerLead,
  type CustomerOperationsProps,
} from "./customer-operations-types";

function safeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function CustomersOperationsClient({
  initialLeads,
  profiles,
  courses,
  sources,
  cities,
  educationLevels,
  enhancedSchemaReady,
  role,
  totalCount,
  page,
  pageSize,
  initialFilters,
}: CustomerOperationsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useI18n();
  const isArabic = language === "ar";
  const locale = isArabic ? "ar-SA" : "en-US";
  const tx = (ar: string, en: string) => (isArabic ? ar : en);

  const [leads, setLeads] = useState(initialLeads);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLeads(initialLeads);
    setSelectedIds([]);
  }, [initialLeads]);

  useEffect(() => setFilters(initialFilters), [initialFilters]);

  const activeProfiles = useMemo(
    () => profiles.filter((profile) => profile.is_active !== false),
    [profiles]
  );
  const salesProfiles = useMemo(
    () => activeProfiles.filter((profile) => ["sales", "manager"].includes(profile.role ?? "")),
    [activeProfiles]
  );
  const profileMap = useMemo(
    () => new Map(activeProfiles.map((profile) => [profile.id, profile])),
    [activeProfiles]
  );

  const canTransfer = ["developer", "admin", "manager", "moderator"].includes(role ?? "");
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageIds = leads.map((lead) => lead.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: totalCount,
      visible: leads.length,
      unassigned: leads.filter((lead) => !lead.owner_id).length,
      dueToday: leads.filter((lead) => {
        const date = safeDate(lead.next_follow_up_at);
        return Boolean(date && date.toDateString() === today);
      }).length,
    };
  }, [leads, totalCount]);

  function statusLabel(value?: string | null) {
    const labels: Record<string, [string, string]> = {
      interested: ["مهتم", "Interested"],
      not_interested: ["غير مهتم", "Not interested"],
      need_offer: ["يحتاج عرض", "Need offer"],
      missed: ["لم يرد", "No answer"],
      wrong_number: ["رقم خطأ", "Wrong number"],
      paid: ["مدفوع", "Paid"],
      busy: ["مشغول", "Busy"],
      fresh: ["جديد", "Fresh"],
      retargeted: ["إعادة استهداف", "Retargeted"],
      redirected: ["محوّل", "Redirected"],
      rejected: ["مرفوض", "Rejected"],
    };
    const item = value ? labels[value] : null;
    return item ? tx(item[0], item[1]) : value || "-";
  }

  function connectionLabel(value?: string | null) {
    const labels: Record<string, [string, string]> = {
      distributed: ["موزع", "Distributed"],
      ivr: ["رد آلي", "IVR"],
      manual: ["إدخال يدوي", "Manual"],
      redirected: ["محوّل", "Redirected"],
    };
    const item = value ? labels[value] : null;
    return item ? tx(item[0], item[1]) : value || "-";
  }

  function inferredConnection(lead: CustomerLead) {
    if (lead.connection_type) return lead.connection_type;
    if (lead.lead_type === "redirected") return "redirected";
    if ((lead.source ?? "").toLowerCase().includes("ivr")) return "ivr";
    return lead.owner_id ? "distributed" : "manual";
  }

  function ownerName(id?: string | null) {
    if (!id) return tx("غير موزع", "Unassigned");
    const profile = profileMap.get(id);
    return profile?.full_name ?? profile?.email ?? id;
  }

  function formatDate(value?: string | null) {
    const date = safeDate(value);
    return date ? date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "-";
  }

  function updateQuery(nextFilters: CustomerFilters, nextPage = 1, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(nextFilters)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setFilter(field: keyof CustomerFilters, value: string, applyNow = false) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    if (applyNow) updateQuery(next, 1, pageSize);
  }

  function quickFollowup(value: string) {
    const next = {
      ...filters,
      followup: value,
      startDate: value === "custom" ? filters.startDate : "",
      endDate: value === "custom" ? filters.endDate : "",
    };
    setFilters(next);
    updateQuery(next, 1, pageSize);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function togglePageSelection() {
    setSelectedIds((current) => allPageSelected
      ? current.filter((id) => !pageIds.includes(id))
      : Array.from(new Set([...current, ...pageIds]))
    );
  }

  async function transferSelected() {
    setError("");
    setMessage("");
    if (!selectedIds.length) return setError(tx("اختر عميلًا واحدًا على الأقل.", "Select at least one customer."));
    if (!targetUserId) return setError(tx("اختر موظف المبيعات المستلم.", "Choose the receiving sales user."));

    setSaving(true);
    try {
      const response = await fetch("/api/v1/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", lead_ids: selectedIds, target_user_id: targetUserId }),
      });
      const result = await response.json();
      if (!response.ok) return setError(result.message ?? tx("تعذر تحويل العملاء.", "Unable to transfer customers."));

      const updated = (result.data ?? []) as CustomerLead[];
      const updateMap = new Map(updated.map((lead) => [lead.id, lead]));
      setLeads((current) => current.map((lead) => updateMap.get(lead.id) ?? lead));
      setSelectedIds([]);
      setMessage(result.message ?? tx("تم تحويل العملاء بنجاح.", "Customers transferred successfully."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tx("حدث خطأ غير متوقع.", "Unexpected error."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={tx("إجمالي العملاء", "Total customers")} value={stats.total} />
        <Metric label={tx("المعروض", "Visible")} value={stats.visible} />
        <Metric label={tx("غير موزعين", "Unassigned")} value={stats.unassigned} />
        <Metric label={tx("متابعات اليوم", "Due today")} value={stats.dueToday} />
      </section>

      <CustomerOperationsFilters
        filters={filters}
        profiles={activeProfiles}
        courses={courses}
        sources={sources}
        cities={cities}
        educationLevels={educationLevels}
        enhancedSchemaReady={enhancedSchemaReady}
        role={role}
        pageSize={pageSize}
        isArabic={isArabic}
        tx={tx}
        onSetFilter={setFilter}
        onQuickFollowup={quickFollowup}
        onApply={() => updateQuery(filters, 1, pageSize)}
        onReset={() => { const empty = emptyCustomerFilters(); setFilters(empty); setSelectedIds([]); updateQuery(empty, 1, pageSize); }}
        onPageSize={(size) => updateQuery(filters, 1, size)}
        statusLabel={statusLabel}
        connectionLabel={connectionLabel}
      />

      {canTransfer ? (
        <section className="v8-card rounded-md p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="v8-heading mb-1.5 block text-xs font-semibold">{tx("تحويل العملاء المحددين إلى", "Transfer selected customers to")}</span>
              <select value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} className="v8-input w-full rounded border px-3 py-2.5 text-sm">
                <option value="">{tx("اختر موظف المبيعات", "Choose sales user")}</option>
                {salesProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>)}
              </select>
            </label>
            <button type="button" disabled={saving || !selectedIds.length} onClick={transferSelected} className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {tx(`تحويل ${selectedIds.length} عميل`, `Transfer ${selectedIds.length} customers`)}
            </button>
          </div>
          {error ? <Notice error>{error}</Notice> : null}
          {message ? <Notice>{message}</Notice> : null}
        </section>
      ) : null}

      <CustomerOperationsTable
        leads={leads}
        canTransfer={canTransfer}
        selectedIds={selectedIds}
        allPageSelected={allPageSelected}
        page={page}
        totalPages={totalPages}
        isArabic={isArabic}
        tx={tx}
        onToggleRow={toggleSelected}
        onTogglePage={togglePageSelection}
        onPage={(nextPage) => updateQuery(filters, nextPage, pageSize)}
        statusLabel={statusLabel}
        connectionLabel={connectionLabel}
        ownerName={ownerName}
        inferredConnection={inferredConnection}
        formatDate={formatDate}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="v8-card rounded-md p-4"><div className="flex items-center justify-between"><UsersRound className="h-5 w-5 text-emerald-600" /><strong className="v8-heading text-2xl">{value}</strong></div><p className="v8-muted mt-3 text-xs">{label}</p></div>;
}

function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`mt-3 flex items-start gap-2 rounded border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{children}</div>;
}
