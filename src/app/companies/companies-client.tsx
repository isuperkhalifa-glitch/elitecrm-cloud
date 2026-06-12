"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

type Company = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  status: string;
  commission_type: string | null;
  commission_value: number | null;
  created_at: string;
};

type CompaniesClientProps = {
  initialCompanies: Company[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type CompanyForm = {
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  commission_type: string;
  commission_value: string;
};

const emptyForm: CompanyForm = {
  name: "",
  industry: "",
  website: "",
  phone: "",
  email: "",
  city: "",
  country: "السعودية",
  commission_type: "percentage",
  commission_value: "0",
};

export function CompaniesClient({
  initialCompanies,
  currentUserId,
  userEmail,
  fullName,
  role,
}: CompaniesClientProps) {
  const { t, language } = useI18n();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredCompanies = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return companies;

    return companies.filter((company) => {
      return [
        company.name,
        company.industry,
        company.phone,
        company.email,
        company.city,
        company.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [companies, search]);

  function updateField(field: keyof CompanyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(company: Company) {
    setEditingId(company.id);
    setMessage("");
    setError("");
    setForm({
      name: company.name ?? "",
      industry: company.industry ?? "",
      website: company.website ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      city: company.city ?? "",
      country: company.country ?? "",
      commission_type: company.commission_type ?? "percentage",
      commission_value: String(company.commission_value ?? 0),
    });
  }

  async function saveCompany() {
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError(t("requiredField"));
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const payload = {
      name: form.name.trim(),
      industry: form.industry.trim() || null,
      website: form.website.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      country: form.country.trim() || null,
      commission_type: form.commission_type,
      commission_value: Number(form.commission_value || 0),
      owner_id: currentUserId,
      status: "active",
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("companies")
        .update(payload)
        .eq("id", editingId)
        .select(
          "id,name,industry,website,phone,email,city,country,status,commission_type,commission_value,created_at"
        )
        .single();

      setSaving(false);

      if (error || !data) {
        setError(t("companySaveError"));
        return;
      }

      const updatedCompany = data as Company;

      setCompanies((current) =>
        current.map((company) =>
          company.id === updatedCompany.id ? updatedCompany : company
        )
      );

      setMessage(t("companyUpdated"));
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("companies")
      .insert(payload)
      .select(
        "id,name,industry,website,phone,email,city,country,status,commission_type,commission_value,created_at"
      )
      .single();

    setSaving(false);

    if (error || !data) {
      setError(t("companySaveError"));
      return;
    }

    setCompanies((current) => [data as Company, ...current]);
    setMessage(t("companySaved"));
    resetForm();
  }

  async function archiveCompany(companyId: string) {
    if (!window.confirm(t("confirmArchive"))) return;

    const supabase = createClient();

    const { data, error } = await supabase
      .from("companies")
      .update({ status: "archived" })
      .eq("id", companyId)
      .select(
        "id,name,industry,website,phone,email,city,country,status,commission_type,commission_value,created_at"
      )
      .single();

    if (error || !data) {
      setError(t("companySaveError"));
      return;
    }

    const updatedCompany = data as Company;

    setCompanies((current) =>
      current.map((company) =>
        company.id === updatedCompany.id ? updatedCompany : company
      )
    );

    setMessage(t("companyArchived"));
  }

  async function restoreCompany(companyId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("companies")
      .update({ status: "active" })
      .eq("id", companyId)
      .select(
        "id,name,industry,website,phone,email,city,country,status,commission_type,commission_value,created_at"
      )
      .single();

    if (error || !data) {
      setError(t("companySaveError"));
      return;
    }

    const updatedCompany = data as Company;

    setCompanies((current) =>
      current.map((company) =>
        company.id === updatedCompany.id ? updatedCompany : company
      )
    );
  }

  async function deleteCompany(companyId: string) {
    if (!window.confirm(t("confirmDelete"))) return;

    const supabase = createClient();

    const { error } = await supabase.from("companies").delete().eq("id", companyId);

    if (error) {
      setError(t("companySaveError"));
      return;
    }

    setCompanies((current) => current.filter((company) => company.id !== companyId));
    setMessage(t("companyDeleted"));
  }

  return (
    <AppShell
      titleKey="companies"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <p className="text-sm text-emerald-300">
            {editingId ? t("editCompany") : t("addCompany")}
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">{t("companyName")}</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{t("industry")}</span>
                <input
                  value={form.industry}
                  onChange={(event) => updateField("industry", event.target.value)}
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
              <span className="text-sm text-slate-300">{t("website")}</span>
              <input
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                dir="ltr"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{t("city")}</span>
                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{t("country")}</span>
                <input
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{t("commissionType")}</span>
                <select
                  value={form.commission_type}
                  onChange={(event) =>
                    updateField("commission_type", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  <option value="percentage">{t("percentage")}</option>
                  <option value="fixed">{t("fixed")}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{t("commissionValue")}</span>
                <input
                  value={form.commission_value}
                  onChange={(event) =>
                    updateField("commission_value", event.target.value)
                  }
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
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
                onClick={saveCompany}
                disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                type="button"
              >
                {editingId ? t("updateCompany") : t("addCompany")}
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

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{t("totalCompanies")}</p>
              <h2 className="mt-1 text-3xl font-bold">{companies.length}</h2>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchCompanies")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400 md:max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-sm text-slate-400">
                  <th className="px-4 py-2 text-start">{t("companyName")}</th>
                  <th className="px-4 py-2 text-start">{t("industry")}</th>
                  <th className="px-4 py-2 text-start">{t("phone")}</th>
                  <th className="px-4 py-2 text-start">{t("city")}</th>
                  <th className="px-4 py-2 text-start">{t("commissionValue")}</th>
                  <th className="px-4 py-2 text-start">{t("status")}</th>
                  <th className="px-4 py-2 text-start">{t("actions")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="bg-slate-900/70">
                    <td className="rounded-s-2xl px-4 py-4">
                      <p className="font-semibold text-white">{company.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{company.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {company.industry || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300" dir="ltr">
                      {company.phone || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {company.city || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {company.commission_type === "fixed"
                        ? t("fixed")
                        : t("percentage")}{" "}
                      — {company.commission_value ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          company.status === "archived"
                            ? "bg-slate-700 text-slate-300"
                            : "bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {company.status === "archived" ? t("archived") : t("active")}
                      </span>
                    </td>
                    <td className="rounded-e-2xl px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(company)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                          type="button"
                        >
                          {t("edit")}
                        </button>

                        {company.status === "archived" ? (
                          <button
                            onClick={() => restoreCompany(company.id)}
                            className="rounded-xl border border-emerald-400/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-400/10"
                            type="button"
                          >
                            {t("restore")}
                          </button>
                        ) : (
                          <button
                            onClick={() => archiveCompany(company.id)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                            type="button"
                          >
                            {t("archive")}
                          </button>
                        )}

                        <button
                          onClick={() => deleteCompany(company.id)}
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

            {filteredCompanies.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-400">
                {t("noCompanies")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
