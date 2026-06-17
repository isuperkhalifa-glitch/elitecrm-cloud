"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, UsersRound } from "lucide-react";

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
  assigned_at?: string | null;
  last_contact_at?: string | null;
  next_follow_up_at?: string | null;
  last_note?: string | null;
  registration_status?: string | null;
  payment_status?: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

type Filters = {
  q: string;
  status: string;
  owner: string;
  leadType: string;
  followup: string;
  startDate: string;
  endDate: string;
  course: string;
};

type Props = {
  initialLeads: Lead[];
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
  { value: "", label: "كل المتابعات" },
  { value: "overdue", label: "متأخر" },
  { value: "today", label: "اليوم" },
  { value: "tomorrow", label: "بكرة" },
  { value: "3days", label: "بعد 3 أيام" },
  { value: "7days", label: "بعد 7 أيام" },
  { value: "month", label: "هذا الشهر" },
  { value: "custom", label: "تاريخ مخصص" },
];

function statusLabel(value?: string | null) {
  const map: Record<string, string> = {
    interested: "مهتم",
    not_interested: "غير مهتم",
    need_offer: "يحتاج عرض",
    missed: "لم يرد",
    wrong_number: "رقم خطأ",
    paid: "مدفوع",
    busy: "مشغول",
    fresh: "جديد",
    retargeted: "إعادة استهداف",
    redirected: "محول",
    not_registered: "غير مسجل",
    registered: "مسجل",
    pending: "قيد المراجعة",
    canceled: "ملغي",
    unpaid: "غير مدفوع",
    partial: "دفع جزئي",
    refunded: "مسترد",
  };

  return value ? map[value] ?? value : "-";
}

function badgeClass(status?: string | null) {
  if (status === "paid") return "border-emerald-400/20 bg-emerald-400/15 text-emerald-300";
  if (status === "interested" || status === "need_offer") return "border-sky-400/20 bg-sky-400/15 text-sky-300";
  if (status === "busy" || status === "missed") return "border-amber-400/20 bg-amber-400/15 text-amber-300";
  if (status === "wrong_number" || status === "not_interested") return "border-red-400/20 bg-red-400/15 text-red-300";
  return "border-white/10 bg-white/10 text-slate-300";
}

function phoneDisplay(lead: Lead) {
  const code = lead.country_code ?? "";
  const number = lead.phone_number ?? "";
  if (number) return `${code} ${number}`.trim();
  return lead.phone ?? "-";
}

function shortDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "-";
  }
}

function ownerName(profiles: Profile[], id?: string | null) {
  if (!id) return "غير موزع";
  const profile = profiles.find((item) => item.id === id);
  return profile?.full_name ?? profile?.email ?? "غير معروف";
}

function customerHref(lead: Lead) {
  return `/customers/${encodeURIComponent(lead.customer_code || lead.id)}`;
}

export function CustomersClient({
  initialLeads,
  profiles,
  role,
  totalCount,
  page,
  pageSize,
  initialFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.is_active !== false), [profiles]);

  const stats = useMemo(() => {
    return {
      total: totalCount,
      visible: leads.length,
      today: leads.filter((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).toDateString() === new Date().toDateString()).length,
      unpaid: leads.filter((lead) => lead.payment_status === "unpaid" || lead.payment_status === "partial").length,
    };
  }, [leads, totalCount]);

  function updateQuery(nextFilters: Filters, nextPage = 1, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(nextFilters)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setFilter(field: keyof Filters, value: string, applyNow = false) {
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

  function applyFilters() {
    updateQuery(filters, 1, pageSize);
  }

  function resetFilters() {
    const empty = { q: "", status: "", owner: "", leadType: "", followup: "", startDate: "", endDate: "", course: "" };
    setFilters(empty);
    updateQuery(empty, 1, pageSize);
  }

  function goToPage(nextPage: number) {
    updateQuery(filters, Math.min(Math.max(1, nextPage), totalPages), pageSize);
  }

  function changePageSize(value: string) {
    updateQuery(filters, 1, Number(value));
  }

  return (
    <div className="space-y-6">
      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-emerald-300">نظام تشغيل العملاء</p>
            <h2 className="mt-1 text-3xl font-black">العملاء</h2>
            <p className="mt-2 text-sm text-slate-400">كل عميل له صفحة كاملة برابط ثابت، والفلترة تعمل فورًا بدون تحديث يدوي.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <Stat label="الإجمالي" value={stats.total} />
            <Stat label="المعروض" value={stats.visible} />
            <Stat label="متابعات اليوم" value={stats.today} />
            <Stat label="مدفوعات مفتوحة" value={stats.unpaid} />
          </div>
        </div>
      </section>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {followupOptions.map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              onClick={() => quickFollowup(item.value)}
              className={
                "rounded-2xl border px-4 py-2 text-sm font-bold transition " +
                (filters.followup === item.value
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10")
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="xl:col-span-2">
            <span className="mb-2 block text-xs text-slate-500">بحث</span>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-slate-500" />
              <input
                value={filters.q}
                onChange={(event) => setFilter("q", event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") applyFilters(); }}
                placeholder="اسم / رقم / دورة"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-9 py-3 text-sm outline-none focus:border-emerald-400"
              />
            </div>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">الحالة</span>
            <select value={filters.status} onChange={(event) => setFilter("status", event.target.value, true)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="">كل الحالات</option>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">المستخدم المسؤول</span>
            <select value={filters.owner} onChange={(event) => setFilter("owner", event.target.value, true)} disabled={role === "sales"} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400 disabled:opacity-50">
              <option value="">كل المستخدمين</option>
              {activeProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">نوع العميل</span>
            <select value={filters.leadType} onChange={(event) => setFilter("leadType", event.target.value, true)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="">كل الأنواع</option>
              {leadTypeOptions.map((type) => <option key={type} value={type}>{statusLabel(type)}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">الدورة</span>
            <input
              value={filters.course}
              onChange={(event) => setFilter("course", event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") applyFilters(); }}
              placeholder="PMP / Excel"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs text-slate-500">عرض</span>
            <select value={pageSize} onChange={(event) => changePageSize(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>

        {filters.followup === "custom" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400" />
            <input type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none focus:border-emerald-400" />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={applyFilters} className="rounded-2xl bg-emerald-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-300">تطبيق الفلتر</button>
          <button type="button" onClick={resetFilters} className="rounded-2xl border border-white/10 px-5 py-2 text-sm font-bold text-slate-300 hover:bg-white/10">إعادة ضبط</button>
        </div>
      </section>

      <section className="safe-card overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-white/[0.03] text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 text-start">الكود</th>
                <th className="px-4 py-3 text-start">العميل</th>
                <th className="px-4 py-3 text-start">الجوال</th>
                <th className="px-4 py-3 text-start">الدورة</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-start">المسؤول</th>
                <th className="px-4 py-3 text-start">المتابعة</th>
                <th className="px-4 py-3 text-start">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leads.map((lead) => {
                const status = lead.customer_status ?? lead.status;
                return (
                  <tr key={lead.id} className="hover:bg-white/[0.04]">
                    <td className="px-4 py-4 font-mono text-xs text-emerald-300" dir="ltr">{lead.customer_code ?? lead.id.slice(0, 8)}</td>
                    <td className="px-4 py-4">
                      <div className="font-black text-white">{lead.full_name ?? "بدون اسم"}</div>
                      <div className="mt-1 text-xs text-slate-500">{lead.email ?? lead.source ?? "-"}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300" dir="ltr">{phoneDisplay(lead)}</td>
                    <td className="px-4 py-4 text-slate-300">{lead.program ?? lead.course_name ?? "-"}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(status)}`}>{statusLabel(status)}</span></td>
                    <td className="px-4 py-4 text-slate-300">{ownerName(activeProfiles, lead.owner_id)}</td>
                    <td className="px-4 py-4 text-slate-300">{shortDate(lead.next_follow_up_at)}</td>
                    <td className="px-4 py-4">
                      <Link href={customerHref(lead)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">
                        فتح الصفحة
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!leads.length ? (
          <div className="p-10 text-center text-slate-400">
            <UsersRound className="mx-auto mb-3 h-8 w-8" />
            لا يوجد عملاء مطابقين للفلاتر الحالية.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-white/10 p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">صفحة {page} من {totalPages}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" /> السابق
            </button>
            <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">
              التالي <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
