"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";
import { usePageText, useSettingOptions } from "@/components/page-settings";
import {
  countryCodes,
  courseOptions,
  getCourseName,
  getLeadStatusClass,
  getLeadStatusLabel,
  getLeadTypeClass,
  getLeadTypeLabel,
  leadStatusValues,
  leadTypeValues,
  normalizePhoneInput,
  splitPhone,
} from "@/lib/crm/customer-core";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  status: string;
  priority: string;
  owner_id: string | null;
  program?: string | null;
  course_id?: string | null;
  lead_type?: string | null;
  assigned_at: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  last_note: string | null;
  customer_status: string | null;
  registration_status: string | null;
  payment_status: string | null;
  transferred_from: string | null;
  transferred_to: string | null;
  transfer_reason: string | null;
  transferred_at: string | null;
  created_at: string;
};

type LeadsClientProps = {
  initialLeads: Lead[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type LeadForm = {
  full_name: string;
  country_code: string;
  phone_number: string;
  email: string;
  company_name: string;
  source: string;
  status: string;
  priority: string;
  lead_type: string;
  course_id: string;
};

const emptyForm: LeadForm = {
  full_name: "",
  country_code: "+966",
  phone_number: "",
  email: "",
  company_name: "",
  source: "",
  status: "interested",
  priority: "medium",
  lead_type: "fresh",
  course_id: "",
};

export function LeadsClient({
  initialLeads,
  currentUserId,
  userEmail,
  fullName,
  role,
}: LeadsClientProps) {
  const { t, language } = useI18n();
  const { scope } = useScope();
  const pageTitle = usePageText("pages.leads.title", "العملاء", "Leads");
  const pageDescription = usePageText(
    "pages.leads.description",
    "إضافة وإدارة عملاء الدورات مع الحالة ونوع العميل والدورة.",
    "Add and manage course customers with status, type, and course."
  );

  const leadStatusOptions = useSettingOptions("crm.lead_statuses", [...leadStatusValues]);
  const leadTypeOptions = useSettingOptions("crm.lead_types", [...leadTypeValues]);
  const priorityOptions = useSettingOptions("crm.priorities", ["low", "medium", "high", "urgent"]);

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const scopedLeads = useMemo(() => {
    if (scope.mode === "user" && scope.targetId) {
      return leads.filter((lead) => lead.owner_id === scope.targetId);
    }

    if (scope.mode === "company" && scope.targetName) {
      return leads.filter((lead) =>
        (lead.company_name ?? "").toLowerCase().includes(scope.targetName.toLowerCase())
      );
    }

    return leads;
  }, [leads, scope]);

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return scopedLeads.filter((lead) => {
      const status = lead.customer_status ?? lead.status;
      const leadType = lead.lead_type ?? "fresh";

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesType = typeFilter === "all" || leadType === typeFilter;

      const matchesKeyword =
        !keyword ||
        [
          lead.full_name,
          lead.email,
          lead.phone,
          lead.phone_number,
          lead.country_code,
          lead.company_name,
          lead.source,
          lead.program,
          lead.course_id,
          getCourseName(lead.course_id, language),
          getLeadStatusLabel(status, language),
          getLeadTypeLabel(leadType, language),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesType && matchesKeyword;
    });
  }, [scopedLeads, search, statusFilter, typeFilter, language]);

  function getPriorityLabel(priority: string) {
    if (priority === "low") return t("lowPriority");
    if (priority === "high") return t("highPriority");
    if (priority === "urgent") return t("urgentPriority");
    return t("mediumPriority");
  }

  function updateField(field: keyof LeadForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function displayPhone(lead: Lead) {
    if (lead.country_code && lead.phone_number) return `${lead.country_code}${lead.phone_number}`;
    if (lead.phone) {
      const split = splitPhone(lead.phone);
      return `${split.country_code}${split.phone_number}`;
    }
    return "-";
  }

  function startEdit(lead: Lead) {
    const split = splitPhone(lead.phone);
    setEditingId(lead.id);
    setMessage("");
    setError("");
    setForm({
      full_name: lead.full_name ?? "",
      country_code: lead.country_code ?? split.country_code,
      phone_number: lead.phone_number ?? split.phone_number,
      email: lead.email ?? "",
      company_name: lead.company_name ?? "",
      source: lead.source ?? "",
      status: lead.customer_status ?? lead.status ?? "interested",
      priority: lead.priority ?? "medium",
      lead_type: lead.lead_type ?? "fresh",
      course_id: lead.course_id ?? "",
    });
  }

  async function saveLead() {
    setMessage("");
    setError("");

    if (!form.full_name.trim()) {
      setError(t("requiredField"));
      return;
    }

    const phoneParts = normalizePhoneInput(form.country_code, form.phone_number);

    setSaving(true);

    const supabase = createClient();

    const payload = {
      full_name: form.full_name.trim(),
      phone: phoneParts.phone || null,
      country_code: phoneParts.country_code,
      phone_number: phoneParts.phone_number || null,
      email: form.email.trim() || null,
      company_name: form.company_name.trim() || null,
      source: form.source.trim() || null,
      status: form.status,
      customer_status: form.status,
      priority: form.priority,
      lead_type: form.lead_type,
      course_id: form.course_id || null,
      owner_id: scope.mode === "user" && scope.targetId ? scope.targetId : currentUserId,
      assigned_at: new Date().toISOString(),
      registration_status: "not_registered",
      payment_status: form.status === "paid" ? "paid" : "unpaid",
      status_updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", editingId)
        .select("*")
        .single();

      setSaving(false);

      if (error || !data) {
        console.error(error);
        setError(error?.message ?? t("leadSaveError"));
        return;
      }

      setLeads((current) => current.map((lead) => (lead.id === editingId ? (data as Lead) : lead)));
      setMessage(t("leadUpdated"));
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    setSaving(false);

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? t("leadSaveError"));
      return;
    }

    setLeads((current) => [data as Lead, ...current]);
    setMessage(t("leadSaved"));
    resetForm();
  }

  async function deleteLead(leadId: string) {
    if (!window.confirm(t("confirmDeleteLead"))) return;

    const supabase = createClient();
    const { error } = await supabase.from("leads").delete().eq("id", leadId);

    if (error) {
      console.error(error);
      setError(error?.message ?? t("leadSaveError"));
      return;
    }

    setLeads((current) => current.filter((lead) => lead.id !== leadId));
    setMessage(t("leadDeleted"));
  }

  return (
    <AppShell titleKey="leads" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <p className="text-sm text-emerald-300">
            {editingId ? t("editLead") : t("addLead")}
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">{t("leadName")}</span>
              <input
                value={form.full_name}
                onChange={(event) => updateField("full_name", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{language === "ar" ? "الدورة" : "Course"}</span>
              <select
                value={form.course_id}
                onChange={(event) => updateField("course_id", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="">{language === "ar" ? "اختار الدورة" : "Choose course"}</option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course[language]}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-[120px_1fr] gap-3">
              <label className="block">
                <span className="text-sm text-slate-300">{language === "ar" ? "كود الدولة" : "Code"}</span>
                <select
                  value={form.country_code}
                  onChange={(event) => updateField("country_code", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.code}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{language === "ar" ? "رقم الجوال بدون صفر" : "Phone without leading zero"}</span>
                <input
                  value={form.phone_number}
                  onChange={(event) => updateField("phone_number", event.target.value.replace(/\D/g, "").replace(/^0+/, ""))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm text-slate-300">{t("email")}</span>
              <input
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                dir="ltr"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{t("leadCompany")}</span>
              <input
                value={form.company_name}
                onChange={(event) => updateField("company_name", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{t("source")}</span>
              <input
                value={form.source}
                onChange={(event) => updateField("source", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{t("status")}</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {leadStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getLeadStatusLabel(status, language)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{language === "ar" ? "نوع العميل" : "Lead type"}</span>
                <select
                  value={form.lead_type}
                  onChange={(event) => updateField("lead_type", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {leadTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {getLeadTypeLabel(type, language)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{t("priority")}</span>
                <select
                  value={form.priority}
                  onChange={(event) => updateField("priority", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {getPriorityLabel(priority)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={saveLead}
                disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                type="button"
              >
                {editingId ? t("updateLead") : t("addLead")}
              </button>

              {editingId ? (
                <button
                  onClick={resetForm}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
                  type="button"
                >
                  {t("cancelEdit")}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{pageDescription}</p>
              <h2 className="mt-1 text-3xl font-bold">{pageTitle} ({filteredLeads.length})</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchLeads")}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="all">{language === "ar" ? "كل الحالات" : "All statuses"}</option>
                {leadStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getLeadStatusLabel(status, language)}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="all">{language === "ar" ? "كل الأنواع" : "All types"}</option>
                {leadTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {getLeadTypeLabel(type, language)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="safe-scroll">
            <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-sm text-slate-400">
                  <th className="px-4 py-2 text-start">{t("leadName")}</th>
                  <th className="px-4 py-2 text-start">{language === "ar" ? "الدورة" : "Course"}</th>
                  <th className="px-4 py-2 text-start">{t("phone")}</th>
                  <th className="px-4 py-2 text-start">{language === "ar" ? "نوع العميل" : "Type"}</th>
                  <th className="px-4 py-2 text-start">{t("source")}</th>
                  <th className="px-4 py-2 text-start">{t("status")}</th>
                  <th className="px-4 py-2 text-start">{t("priority")}</th>
                  <th className="px-4 py-2 text-start">{t("actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => {
                  const status = lead.customer_status ?? lead.status;
                  const leadType = lead.lead_type ?? "fresh";

                  return (
                    <tr key={lead.id} className="bg-slate-900/70">
                      <td className="rounded-s-2xl px-4 py-4">
                        <p className="font-semibold text-white">{lead.full_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{lead.email}</p>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-300">
                        {getCourseName(lead.course_id, language) !== "-" ? getCourseName(lead.course_id, language) : lead.program || "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-300" dir="ltr">
                        {displayPhone(lead)}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs ${getLeadTypeClass(leadType)}`}>
                          {getLeadTypeLabel(leadType, language)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-300">
                        {lead.source || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs ${getLeadStatusClass(status)}`}>
                          {getLeadStatusLabel(status, language)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                          {getPriorityLabel(lead.priority)}
                        </span>
                      </td>

                      <td className="rounded-e-2xl px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEdit(lead)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                            type="button"
                          >
                            {t("edit")}
                          </button>

                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                            type="button"
                          >
                            {t("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredLeads.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-400">
                {t("noLeads")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}