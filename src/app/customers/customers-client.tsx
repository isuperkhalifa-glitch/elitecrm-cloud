"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Search } from "lucide-react";

type Lead = {
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
  priority?: string | null;
  owner_id?: string | null;
  program?: string | null;
  course_name?: string | null;
  lead_type?: string | null;
  next_follow_up_at?: string | null;
  payment_status?: string | null;
  created_at: string;
};

type Profile = { id: string; full_name: string | null; email?: string | null; role?: string | null; is_active?: boolean | null };
type Activity = { id: string; lead_id: string; actor_id: string | null; actor_name: string | null; action: string; old_value: string | null; new_value: string | null; note: string | null; created_at: string };
type Filters = { q: string; status: string; owner: string; leadType: string; followup: string; startDate: string; endDate: string; course: string };

type Props = {
  initialLeads: Lead[];
  initialActivities: Activity[];
  profiles: Profile[];
  currentUserId: string;
  currentUserName: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  initialFilters: Filters;
};

const statusOptions = ["interested", "not_interested", "need_offer", "missed", "wrong_number", "paid", "busy"];
const leadTypeOptions = ["fresh", "retargeted", "redirected"];
const followupOptions = [
  { value: "", label: "ظƒظ„ ط§ظ„ظ…طھط§ط¨ط¹ط§طھ" },
  { value: "overdue", label: "ظ…طھط£ط®ط±" },
  { value: "today", label: "ط§ظ„ظٹظˆظ…" },
  { value: "tomorrow", label: "ط؛ط¯ظ‹ط§" },
  { value: "3days", label: "ط¨ط¹ط¯ 3 ط£ظٹط§ظ…" },
  { value: "7days", label: "ط¨ط¹ط¯ 7 ط£ظٹط§ظ…" },
  { value: "month", label: "ظ‡ط°ط§ ط§ظ„ط´ظ‡ط±" },
  { value: "custom", label: "طھط§ط±ظٹط® ظ…ط®طµطµ" },
];

function label(value?: string | null) {
  const map: Record<string, string> = {
    interested: "ظ…ظ‡طھظ…",
    not_interested: "ط؛ظٹط± ظ…ظ‡طھظ…",
    need_offer: "ظٹط­طھط§ط¬ ط¹ط±ط¶",
    missed: "ظ„ظ… ظٹط±ط¯",
    wrong_number: "ط±ظ‚ظ… ط®ط·ط£",
    paid: "ظ…ط¯ظپظˆط¹",
    busy: "ظ…ط´ط؛ظˆظ„",
    fresh: "ط¬ط¯ظٹط¯",
    retargeted: "ط¥ط¹ط§ط¯ط© ط§ط³طھظ‡ط¯ط§ظپ",
    redirected: "ظ…ط­ظˆظ„",
    unpaid: "ط؛ظٹط± ظ…ط¯ظپظˆط¹",
    partial: "ط¯ظپط¹ ط¬ط²ط¦ظٹ",
    refunded: "ظ…ط³طھط±ط¯",
  };
  return value ? map[value] ?? value : "-";
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "-";
  }
}

function phoneDisplay(lead: Lead) {
  if (lead.phone_number) return `${lead.country_code ?? ""} ${lead.phone_number}`.trim();
  return lead.phone ?? "-";
}

function ownerName(profiles: Profile[], id?: string | null) {
  if (!id) return "ط؛ظٹط± ظ…ظˆط²ط¹";
  const profile = profiles.find((item) => item.id === id);
  return profile?.full_name ?? profile?.email ?? "ط؛ظٹط± ظ…ط¹ط±ظˆظپ";
}

function badgeClass(status?: string | null) {
  if (status === "paid") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (status === "not_interested" || status === "wrong_number") return "border-red-400/30 bg-red-400/10 text-red-300";
  if (status === "need_offer" || status === "busy") return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  return "border-sky-400/30 bg-sky-400/10 text-sky-300";
}

export function CustomersClient({ initialLeads, profiles, role, totalCount, page, pageSize, initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(initialFilters);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const stats = useMemo(() => {
    const paid = initialLeads.filter((lead) => lead.payment_status === "paid" || lead.status === "paid" || lead.customer_status === "paid").length;
    const today = initialLeads.filter((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).toDateString() === new Date().toDateString()).length;
    return { paid, today };
  }, [initialLeads]);

  function setFilter(field: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function updateQuery(next: Partial<Filters> & { page?: number; pageSize?: number } = {}) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { ...filters, ...next };
    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    params.set("page", String(next.page ?? 1));
    if (next.pageSize) params.set("pageSize", String(next.pageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    setFilters({ q: "", status: "", owner: "", leadType: "", followup: "", startDate: "", endDate: "", course: "" });
    router.push(pathname);
  }

  function openCustomer(lead: Lead) {
    router.push(`/customers/${encodeURIComponent(lead.customer_code || lead.id)}`);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-300">ظ…ط³ط§ط­ط© ط§ظ„ط¹ظ…ظ„ط§ط،</p>
            <h1 className="mt-2 text-3xl font-black text-white">ط§ظ„ط¹ظ…ظ„ط§ط،</h1>
            <p className="mt-2 text-sm text-slate-400">ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ…ظ„ط§ط، ظˆط§ظ„ظ…طھط§ط¨ط¹ط© ظˆط§ظ„طھظˆط²ظٹط¹ ظˆظپطھط­ طµظپط­ط© ظƒط§ظ…ظ„ط© ظ„ظƒظ„ ط¹ظ…ظٹظ„.</p>
          </div>
          <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
            <RefreshCw className="h-4 w-4" /> طھط­ط¯ظٹط«
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Stat title="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ط§ط،" value={totalCount} />
          <Stat title="ظ…طھط§ط¨ط¹ط§طھ ط§ظ„ظٹظˆظ…" value={stats.today} />
          <Stat title="ط¹ظ…ظ„ط§ط، ظ…ط¯ظپظˆط¹ظٹظ†" value={stats.paid} />
        </div>
      </section>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">ط§ظ„ظپظ„ط§طھط±</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => updateQuery()} className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300">
              طھط·ط¨ظٹظ‚ ط§ظ„ظپظ„ط§طھط±
            </button>
            <button type="button" onClick={resetFilters} className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">
              ط¥ظ„ط؛ط§ط، ط§ظ„ظپظ„طھط±
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Field label="ط¨ط­ط«" value={filters.q} onChange={(value) => setFilter("q", value)} placeholder="ط§ط³ظ… / ط¬ظˆط§ظ„ / ط¯ظˆط±ط©" />
          <Select label="ط§ظ„ط­ط§ظ„ط©" value={filters.status} onChange={(value) => setFilter("status", value)} options={[{ value: "", label: "ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ" }, ...statusOptions.map((item) => ({ value: item, label: label(item) }))]} />
          <Select label="ط§ظ„ظ…ط³ط¤ظˆظ„" value={filters.owner} onChange={(value) => setFilter("owner", value)} options={[{ value: "", label: "ظƒظ„ ط§ظ„ط³ظٹظ„ط²" }, ...profiles.map((profile) => ({ value: profile.id, label: profile.full_name ?? profile.email ?? profile.id }))]} />
          <Select label="ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„" value={filters.leadType} onChange={(value) => setFilter("leadType", value)} options={[{ value: "", label: "ظƒظ„ ط§ظ„ط£ظ†ظˆط§ط¹" }, ...leadTypeOptions.map((item) => ({ value: item, label: label(item) }))]} />
          <Select label="ط§ظ„ظ…طھط§ط¨ط¹ط©" value={filters.followup} onChange={(value) => setFilter("followup", value)} options={followupOptions} />
          <Field label="ط§ظ„ط¯ظˆط±ط©" value={filters.course} onChange={(value) => setFilter("course", value)} placeholder="PMP / Excel" />
        </div>
      </section>

      <section className="safe-card overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-white/[0.04] text-slate-400">
              <tr>
                <th className="px-4 py-3 text-start">ط§ظ„ط¹ظ…ظٹظ„</th>
                <th className="px-4 py-3 text-start">ظƒظˆط¯ ط§ظ„ط¹ظ…ظٹظ„</th>
                <th className="px-4 py-3 text-start">ط§ظ„ط¬ظˆط§ظ„</th>
                <th className="px-4 py-3 text-start">ط§ظ„ط¯ظˆط±ط©</th>
                <th className="px-4 py-3 text-start">ط§ظ„ط­ط§ظ„ط©</th>
                <th className="px-4 py-3 text-start">ط§ظ„ظ…ط³ط¤ظˆظ„</th>
                <th className="px-4 py-3 text-start">ط§ظ„ظ…طھط§ط¨ط¹ط©</th>
                <th className="px-4 py-3 text-start">ط¥ط¬ط±ط§ط،</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {initialLeads.map((lead) => {
                const status = lead.customer_status ?? lead.status;
                return (
                  <tr key={lead.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-4">
                      <div className="font-black text-white">{lead.full_name ?? "ط¨ط¯ظˆظ† ط§ط³ظ…"}</div>
                      <div className="mt-1 text-xs text-slate-500">{lead.email ?? lead.source ?? "-"}</div>
                    </td>
                    <td className="px-4 py-4 font-bold text-emerald-300" dir="ltr">{lead.customer_code ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-300" dir="ltr">{phoneDisplay(lead)}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.program ?? lead.course_name ?? "-"}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(status)}`}>{label(status)}</span></td>
                    <td className="px-4 py-4 text-slate-300">{ownerName(profiles, lead.owner_id)}</td>
                    <td className="px-4 py-4 text-slate-300">{dateLabel(lead.next_follow_up_at)}</td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => openCustomer(lead)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">
                        <Eye className="h-4 w-4" /> ظپطھط­ ط§ظ„طµظپط­ط©
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!initialLeads.length ? <div className="p-10 text-center text-slate-400">ظ„ط§ ظٹظˆط¬ط¯ ط¹ظ…ظ„ط§ط، ظ…ط·ط§ط¨ظ‚ظٹظ† ظ„ظ„ظپظ„ط§طھط± ط§ظ„ط­ط§ظ„ظٹط©.</div> : null}

        <div className="flex flex-col gap-3 border-t border-white/10 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">طµظپط­ط© {page} ظ…ظ† {totalPages}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => updateQuery({ page: Math.max(1, page - 1) })} disabled={page <= 1} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" /> ط§ظ„ط³ط§ط¨ظ‚
            </button>
            <button type="button" onClick={() => updateQuery({ page: Math.min(totalPages, page + 1) })} disabled={page >= totalPages} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">
              ط§ظ„طھط§ظ„ظٹ <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <div className="relative">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-10 text-sm text-white outline-none focus:border-emerald-400/60" />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}