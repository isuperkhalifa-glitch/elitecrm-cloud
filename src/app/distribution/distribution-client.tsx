"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { usePageText } from "@/components/page-settings";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Loader2,
  Search,
  Send,
  UserRoundPlus,
  UsersRound,
  XCircle,
} from "lucide-react";

type Lead = {
  id: string;
  full_name: string | null;
  phone: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  lead_type?: string | null;
  course_id?: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  owner_id: string | null;
  program: string | null;
  assigned_at: string | null;
  customer_status: string | null;
  registration_status: string | null;
  payment_status: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type Props = {
  initialLeads: Lead[];
  profiles: Profile[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

export function DistributionClient({
  initialLeads,
  profiles,
  userEmail,
  fullName,
  role,
}: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("unassigned");
  const [selectedSalesId, setSelectedSalesId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  const pageTitle = usePageText("pages.distribution.title", "توزيع العملاء", "Customer Distribution");
  const pageDescription = usePageText(
    "pages.distribution.description",
    "توزيع العملاء على فريق السيلز ومتابعة حالة التوزيع.",
    "Assign customers to the sales team and monitor distribution status."
  );
  const salesUsers = useMemo(() => {
    return profiles.filter((profile) =>
      ["sales", "admin", "manager"].includes(profile.role ?? "")
    );
  }, [profiles]);

  const profileMap = useMemo(() => {
    return new Map(profiles.map((profile) => [profile.id, profile]));
  }, [profiles]);

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unassigned" && !lead.owner_id) ||
        (filter === "assigned" && Boolean(lead.owner_id));

      const matchesKeyword =
        !keyword ||
        [
          lead.full_name,
          lead.phone,
          lead.email,
          lead.company_name,
          lead.source,
          lead.program,
          lead.status,
          lead.customer_status,
          profileMap.get(lead.owner_id ?? "")?.full_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesFilter && matchesKeyword;
    });
  }, [leads, search, filter, profileMap]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      unassigned: leads.filter((lead) => !lead.owner_id).length,
      assigned: leads.filter((lead) => Boolean(lead.owner_id)).length,
      visible: filteredLeads.length,
    };
  }, [leads, filteredLeads]);

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function assignLeads(ids: string[], salesId: string) {
    setMessage("");
    setError("");

    if (!salesId) {
      setError(tx("اختار السيلز أولًا.", "Choose a sales user first."));
      return;
    }

    if (ids.length === 0) {
      setError(tx("اختار عميل واحد على الأقل.", "Select at least one customer."));
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("leads")
      .update({
        owner_id: salesId,
        assigned_at: new Date().toISOString(),
      })
      .in("id", ids)
      .select("*");

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    const updated = (data ?? []) as Lead[];

    setLeads((current) =>
      current.map((lead) => updated.find((item) => item.id === lead.id) ?? lead)
    );

    setSelectedIds([]);
    setMessage(tx("تم توزيع العملاء بنجاح.", "Customers assigned successfully."));
    setSaving(false);
  }

  async function assignOne(leadId: string, salesId: string) {
    setSavingId(leadId);
    await assignLeads([leadId], salesId);
    setSavingId("");
  }

  return (
    <AppShell
      titleKey="distribution"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{tx("إجمالي العملاء", "Total customers")}</p>
          <h2 className="mt-2 text-3xl font-black text-white">{stats.total}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="text-sm text-yellow-300">{tx("غير موزعين", "Unassigned")}</p>
          <h2 className="mt-2 text-3xl font-black text-yellow-300">{stats.unassigned}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-sm text-emerald-300">{tx("موزعين", "Assigned")}</p>
          <h2 className="mt-2 text-3xl font-black text-emerald-300">{stats.assigned}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-sky-400/20 bg-sky-400/10 p-5">
          <p className="text-sm text-sky-300">{tx("المعروض", "Visible")}</p>
          <h2 className="mt-2 text-3xl font-black text-sky-300">{stats.visible}</h2>
        </div>
      </div>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-emerald-300">{pageDescription}</p>
            <h1 className="text-3xl font-black text-white">{pageTitle}</h1>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 md:min-w-80">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tx("بحث بالاسم، الرقم، المصدر...", "Search name, phone, source...")}
                className="w-full border-none bg-transparent p-0 text-white outline-none"
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option value="unassigned">{tx("غير موزعين", "Unassigned")}</option>
              <option value="assigned">{tx("موزعين", "Assigned")}</option>
              <option value="all">{tx("الكل", "All")}</option>
            </select>
          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <select
              value={selectedSalesId}
              onChange={(event) => setSelectedSalesId(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option value="">{tx("اختار السيلز", "Choose sales user")}</option>
              {salesUsers.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name ?? profile.id}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSelectedIds(filteredLeads.map((lead) => lead.id))}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10"
              type="button"
            >
              {tx("تحديد الظاهر", "Select visible")}
            </button>

            <button
              onClick={() => assignLeads(selectedIds, selectedSalesId)}
              disabled={saving || selectedIds.length === 0}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
              type="button"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {tx("توزيع المحدد", "Assign selected")} ({selectedIds.length})
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {filteredLeads.map((lead) => {
            const owner = profileMap.get(lead.owner_id ?? "");

            return (
              <article
                key={lead.id}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-4"
              >
                <div className="grid gap-4 xl:grid-cols-[auto_1fr_230px_180px] xl:items-center">
                  <input
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => toggleSelected(lead.id)}
                    type="checkbox"
                    className="h-5 w-5 accent-emerald-400"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <UsersRound className="h-4 w-4 text-emerald-300" />
                      <h3 className="truncate font-black text-white">
                        {lead.full_name ?? "-"}
                      </h3>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                        {lead.source ?? "-"}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 text-sm text-slate-400 md:grid-cols-3">
                      <p dir="ltr">{lead.phone ?? "-"}</p>
                      <p>{lead.program ?? "-"}</p>
                      <p>{lead.company_name ?? "-"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                    <p className="text-xs text-slate-500">{tx("السيلز الحالي", "Current sales")}</p>
                    <p className="mt-1 font-bold text-white">{owner?.full_name ?? tx("غير موزع", "Unassigned")}</p>
                  </div>

                  <button
                    onClick={() => assignOne(lead.id, selectedSalesId)}
                    disabled={savingId === lead.id || !selectedSalesId}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-400/15 disabled:opacity-60"
                    type="button"
                  >
                    {savingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
                    {tx("توزيع", "Assign")}
                  </button>
                </div>
              </article>
            );
          })}

          {filteredLeads.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
              {tx("لا توجد عملاء في هذا الفلتر.", "No customers in this filter.")}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
