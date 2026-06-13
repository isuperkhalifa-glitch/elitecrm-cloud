"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  status: string;
  priority: string;
  owner_id: string | null;
  program?: string | null;
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
  phone: string;
  email: string;
  company_name: string;
  source: string;
  status: string;
  priority: string;
};

const emptyForm: LeadForm = {
  full_name: "",
  phone: "",
  email: "",
  company_name: "",
  source: "",
  status: "new",
  priority: "medium",
};

export function LeadsClient({
  initialLeads,
  currentUserId,
  userEmail,
  fullName,
  role,
}: LeadsClientProps) {
  const { t } = useI18n();
  const { scope } = useScope();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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

    if (!keyword) return leads;

    return scopedLeads.filter((lead) =>
      [
        lead.full_name,
        lead.phone,
        lead.email,
        lead.company_name,
        lead.source,
        getStatusLabel(lead.status),
        getPriorityLabel(lead.priority),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [scopedLeads, search]);

  function getStatusLabel(status: string) {
    if (status === "contacted") return t("contactedLead");
    if (status === "qualified") return t("qualifiedLead");
    if (status === "converted") return t("convertedLead");
    if (status === "lost") return t("lostLead");
    return t("newLead");
  }

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

  function startEdit(lead: Lead) {
    setEditingId(lead.id);
    setMessage("");
    setError("");
    setForm({
      full_name: lead.full_name ?? "",
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      company_name: lead.company_name ?? "",
      source: lead.source ?? "",
      status: lead.status ?? "new",
      priority: lead.priority ?? "medium",
    });
  }

  async function saveLead() {
    setMessage("");
    setError("");

    if (!form.full_name.trim()) {
      setError(t("requiredField"));
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      company_name: form.company_name.trim() || null,
      source: form.source.trim() || null,
      status: form.status,
      priority: form.priority,
      owner_id: scope.mode === "user" && scope.targetId ? scope.targetId : currentUserId,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", editingId)
        .select("id,full_name,phone,email,company_name,source,status,priority,created_at")
        .single();

      setSaving(false);

      if (error || !data) {
        console.error(error); setError(error?.message ?? t("leadSaveError"));
        return;
      }

      const updatedLead = data as Lead;

      setLeads((current) =>
        current.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      );

      setMessage(t("leadUpdated"));
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("id,full_name,phone,email,company_name,source,status,priority,created_at")
      .single();

    setSaving(false);

    if (error || !data) {
      console.error(error); setError(error?.message ?? t("leadSaveError"));
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
      console.error(error); setError(error?.message ?? t("leadSaveError"));
      return;
    }

    setLeads((current) => current.filter((lead) => lead.id !== leadId));
    setMessage(t("leadDeleted"));
  }

  return (
    <AppShell
      titleKey="leads"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
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
              <span className="text-sm text-slate-300">{t("leadCompany")}</span>
              <input
                value={form.company_name}
                onChange={(event) => updateField("company_name", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{t("phone")}</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                dir="ltr"
              />
            </label>

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
                  <option value="new">{t("newLead")}</option>
                  <option value="contacted">{t("contactedLead")}</option>
                  <option value="qualified">{t("qualifiedLead")}</option>
                  <option value="converted">{t("convertedLead")}</option>
                  <option value="lost">{t("lostLead")}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{t("priority")}</span>
                <select
                  value={form.priority}
                  onChange={(event) => updateField("priority", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  <option value="low">{t("lowPriority")}</option>
                  <option value="medium">{t("mediumPriority")}</option>
                  <option value="high">{t("highPriority")}</option>
                  <option value="urgent">{t("urgentPriority")}</option>
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
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{t("totalLeads")}</p>
              <h2 className="mt-1 text-3xl font-bold">{leads.length}</h2>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchLeads")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400 md:max-w-sm"
            />
          </div>

          <div className="safe-scroll">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-sm text-slate-400">
                  <th className="px-4 py-2 text-start">{t("leadName")}</th>
                  <th className="px-4 py-2 text-start">{t("leadCompany")}</th>
                  <th className="px-4 py-2 text-start">{t("phone")}</th>
                  <th className="px-4 py-2 text-start">{t("source")}</th>
                  <th className="px-4 py-2 text-start">{t("status")}</th>
                  <th className="px-4 py-2 text-start">{t("priority")}</th>
                  <th className="px-4 py-2 text-start">{t("actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="bg-slate-900/70">
                    <td className="rounded-s-2xl px-4 py-4">
                      <p className="font-semibold text-white">{lead.full_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{lead.email}</p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300">
                      {lead.company_name || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300" dir="ltr">
                      {lead.phone || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300">
                      {lead.source || "-"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                        {getStatusLabel(lead.status)}
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
                ))}
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




