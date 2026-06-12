"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

type CompanyOption = {
  id: string;
  name: string;
};

type ContactOption = {
  id: string;
  full_name: string;
  company_id: string | null;
};

type Deal = {
  id: string;
  title: string;
  company_id: string | null;
  contact_id: string | null;
  stage: string;
  amount: number;
  expected_close_date: string | null;
  probability: number | null;
  created_at: string;
  companies?: { name: string } | null;
  contacts?: { full_name: string } | null;
};

type DealsClientProps = {
  initialDeals: Deal[];
  companies: CompanyOption[];
  contacts: ContactOption[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type DealForm = {
  title: string;
  company_id: string;
  contact_id: string;
  stage: string;
  amount: string;
  expected_close_date: string;
  probability: string;
};

const emptyForm: DealForm = {
  title: "",
  company_id: "",
  contact_id: "",
  stage: "new",
  amount: "0",
  expected_close_date: "",
  probability: "10",
};

export function DealsClient({
  initialDeals,
  companies,
  contacts,
  currentUserId,
  userEmail,
  fullName,
  role,
}: DealsClientProps) {
  const { t } = useI18n();
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const availableContacts = useMemo(() => {
    if (!form.company_id) return contacts;
    return contacts.filter((contact) => contact.company_id === form.company_id);
  }, [contacts, form.company_id]);

  const filteredDeals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return deals;

    return deals.filter((deal) =>
      [
        deal.title,
        deal.companies?.name,
        deal.contacts?.full_name,
        getStageLabel(deal.stage),
        String(deal.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [deals, search]);

  function getStageLabel(stage: string) {
    if (stage === "contacted") return t("contactedDeal");
    if (stage === "proposal") return t("proposalDeal");
    if (stage === "negotiation") return t("negotiationDeal");
    if (stage === "won") return t("wonDeal");
    if (stage === "lost") return t("lostDeal");
    return t("newDeal");
  }

  function updateField(field: keyof DealForm, value: string) {
    setForm((current) => {
      if (field === "company_id") {
        return { ...current, company_id: value, contact_id: "" };
      }

      return { ...current, [field]: value };
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(deal: Deal) {
    setEditingId(deal.id);
    setMessage("");
    setError("");
    setForm({
      title: deal.title ?? "",
      company_id: deal.company_id ?? "",
      contact_id: deal.contact_id ?? "",
      stage: deal.stage ?? "new",
      amount: String(deal.amount ?? 0),
      expected_close_date: deal.expected_close_date ?? "",
      probability: String(deal.probability ?? 10),
    });
  }

  async function refreshDeals() {
    const supabase = createClient();

    const { data } = await supabase
      .from("deals")
      .select(
        "id,title,company_id,contact_id,stage,amount,expected_close_date,probability,created_at,companies(name),contacts(full_name)"
      )
      .order("created_at", { ascending: false });

    setDeals((data ?? []) as Deal[]);
  }

  async function saveDeal() {
    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError(t("requiredField"));
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const payload = {
      title: form.title.trim(),
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      stage: form.stage,
      amount: Number(form.amount || 0),
      expected_close_date: form.expected_close_date || null,
      probability: Number(form.probability || 0),
      owner_id: currentUserId,
    };

    if (editingId) {
      const { error } = await supabase
        .from("deals")
        .update(payload)
        .eq("id", editingId);

      setSaving(false);

      if (error) {
        console.error(error); setError(error?.message ?? t("dealSaveError"));
        return;
      }

      setMessage(t("dealUpdated"));
      resetForm();
      await refreshDeals();
      return;
    }

    const { error } = await supabase.from("deals").insert(payload);

    setSaving(false);

    if (error) {
      console.error(error); setError(error?.message ?? t("dealSaveError"));
      return;
    }

    setMessage(t("dealSaved"));
    resetForm();
    await refreshDeals();
  }

  async function deleteDeal(dealId: string) {
    if (!window.confirm(t("confirmDeleteDeal"))) return;

    const supabase = createClient();

    const { error } = await supabase.from("deals").delete().eq("id", dealId);

    if (error) {
      console.error(error); setError(error?.message ?? t("dealSaveError"));
      return;
    }

    setDeals((current) => current.filter((deal) => deal.id !== dealId));
    setMessage(t("dealDeleted"));
  }

  return (
    <AppShell
      titleKey="deals"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <p className="text-sm text-emerald-300">
            {editingId ? t("editDeal") : t("addDeal")}
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">{t("dealTitle")}</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{t("linkedCompany")}</span>
              <select
                value={form.company_id}
                onChange={(event) => updateField("company_id", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="">{t("noCompany")}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{t("linkedContact")}</span>
              <select
                value={form.contact_id}
                onChange={(event) => updateField("contact_id", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="">{t("noContact")}</option>
                {availableContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{t("dealAmount")}</span>
                <input
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{t("probability")}</span>
                <input
                  value={form.probability}
                  onChange={(event) => updateField("probability", event.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm text-slate-300">{t("dealStage")}</span>
              <select
                value={form.stage}
                onChange={(event) => updateField("stage", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="new">{t("newDeal")}</option>
                <option value="contacted">{t("contactedDeal")}</option>
                <option value="proposal">{t("proposalDeal")}</option>
                <option value="negotiation">{t("negotiationDeal")}</option>
                <option value="won">{t("wonDeal")}</option>
                <option value="lost">{t("lostDeal")}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{t("expectedCloseDate")}</span>
              <input
                value={form.expected_close_date}
                onChange={(event) =>
                  updateField("expected_close_date", event.target.value)
                }
                type="date"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                dir="ltr"
              />
            </label>

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
                onClick={saveDeal}
                disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                type="button"
              >
                {editingId ? t("updateDeal") : t("addDeal")}
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
              <p className="text-sm text-emerald-300">{t("totalDeals")}</p>
              <h2 className="mt-1 text-3xl font-bold">{deals.length}</h2>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchDeals")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400 md:max-w-sm"
            />
          </div>

          <div className="safe-scroll">
            <table className="w-full min-w-[820px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-sm text-slate-400">
                  <th className="px-4 py-2 text-start">{t("dealTitle")}</th>
                  <th className="px-4 py-2 text-start">{t("linkedCompany")}</th>
                  <th className="px-4 py-2 text-start">{t("linkedContact")}</th>
                  <th className="px-4 py-2 text-start">{t("dealAmount")}</th>
                  <th className="px-4 py-2 text-start">{t("dealStage")}</th>
                  <th className="px-4 py-2 text-start">{t("probability")}</th>
                  <th className="px-4 py-2 text-start">{t("expectedCloseDate")}</th>
                  <th className="px-4 py-2 text-start">{t("actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="bg-slate-900/70">
                    <td className="rounded-s-2xl px-4 py-4">
                      <p className="font-semibold text-white">{deal.title}</p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300">
                      {deal.companies?.name || t("noCompany")}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300">
                      {deal.contacts?.full_name || t("noContact")}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300" dir="ltr">
                      {deal.amount ?? 0}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                        {getStageLabel(deal.stage)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300" dir="ltr">
                      {deal.probability ?? 0}%
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-300" dir="ltr">
                      {deal.expected_close_date || "-"}
                    </td>

                    <td className="rounded-e-2xl px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(deal)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                          type="button"
                        >
                          {t("edit")}
                        </button>

                        <button
                          onClick={() => deleteDeal(deal.id)}
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

            {filteredDeals.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-400">
                {t("noDeals")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}


