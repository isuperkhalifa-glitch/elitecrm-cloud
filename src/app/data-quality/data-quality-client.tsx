"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Search, ShieldCheck, UsersRound } from "lucide-react";
import { useI18n } from "@/components/language-provider";

type Lead = {
  id: string;
  customer_code: string | null;
  full_name: string | null;
  phone: string | null;
  country_code: string | null;
  phone_number: string | null;
  source: string | null;
  status: string | null;
  customer_status: string | null;
  owner_id: string | null;
  created_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Props = {
  leads: Lead[];
  profiles: Profile[];
};

function rawPhone(lead: Lead) {
  if (lead.phone_number) return `${lead.country_code ?? ""}${lead.phone_number}`;
  return lead.phone ?? "";
}

function normalizePhone(lead: Lead) {
  let digits = rawPhone(lead).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("966") && digits.length >= 12) return digits.slice(-9);
  if (digits.startsWith("0") && digits.length === 10) return digits.slice(-9);
  return digits;
}

function customerHref(lead: Lead) {
  return `/customers/${encodeURIComponent(lead.customer_code || lead.id)}`;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export function DataQualityClient({ leads, profiles }: Props) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const tx = (ar: string, en: string) => (isArabic ? ar : en);
  const locale = isArabic ? "ar-SA" : "en-US";
  const [search, setSearch] = useState("");

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles]
  );

  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, Lead[]>();

    for (const lead of leads) {
      const key = normalizePhone(lead);
      if (!key) continue;
      const current = groups.get(key) ?? [];
      current.push(lead);
      groups.set(key, current);
    }

    return Array.from(groups.entries())
      .filter(([, rows]) => rows.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
  }, [leads]);

  const visibleGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return duplicateGroups;

    return duplicateGroups.filter(([normalized, rows]) => {
      if (normalized.includes(keyword.replace(/\D/g, ""))) return true;
      return rows.some((lead) =>
        [lead.full_name, lead.customer_code, rawPhone(lead), lead.source, lead.status, lead.customer_status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [duplicateGroups, search]);

  const uniquePhones = useMemo(
    () => new Set(leads.map(normalizePhone).filter(Boolean)).size,
    [leads]
  );
  const withoutPhone = useMemo(
    () => leads.filter((lead) => !normalizePhone(lead)).length,
    [leads]
  );
  const duplicateRecords = useMemo(
    () => duplicateGroups.reduce((sum, [, rows]) => sum + rows.length, 0),
    [duplicateGroups]
  );

  return (
    <div className="space-y-5">
      <section className="v8-card rounded-md p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="v8-heading text-xl font-semibold">{tx("جودة بيانات العملاء", "Customer data quality")}</h2>
            </div>
            <p className="v8-muted mt-2 text-sm">
              {tx(
                "فحص الأرقام المكررة والتحقق من العميل قبل التوزيع أو الاستيراد.",
                "Review duplicate phone numbers and verify customers before assignment or import."
              )}
            </p>
          </div>

          <label className="relative block w-full max-w-md">
            <Search className="v8-muted absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tx("ابحث بالاسم أو الرقم أو الكود", "Search name, phone, or code")}
              className="v8-input w-full rounded border py-2.5 pe-3 ps-9 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={tx("إجمالي العملاء", "Total customers")} value={leads.length} icon={<UsersRound className="h-5 w-5" />} />
        <StatCard label={tx("أرقام فريدة", "Unique phones")} value={uniquePhones} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label={tx("مجموعات مكررة", "Duplicate groups")} value={duplicateGroups.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label={tx("بدون رقم", "Missing phone")} value={withoutPhone} icon={<AlertTriangle className="h-5 w-5" />} />
      </section>

      <section className="v8-card rounded-md p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--v8-border)" }}>
          <div>
            <h3 className="v8-heading font-semibold">{tx("الأرقام المكررة المحتملة", "Potential duplicate phones")}</h3>
            <p className="v8-muted mt-1 text-xs">
              {tx(
                `${duplicateRecords} سجل داخل ${duplicateGroups.length} مجموعة`,
                `${duplicateRecords} records across ${duplicateGroups.length} groups`
              )}
            </p>
          </div>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            {tx("مراجعة فقط — لا يوجد حذف تلقائي", "Review only — no automatic deletion")}
          </span>
        </div>

        <div className="space-y-3">
          {visibleGroups.map(([normalized, rows]) => (
            <article key={normalized} className="rounded border p-4" style={{ borderColor: "var(--v8-border)" }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="v8-muted text-xs">{tx("الرقم الموحد", "Normalized phone")}</p>
                  <p className="v8-heading font-semibold" dir="ltr">{normalized}</p>
                </div>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {tx(`${rows.length} سجلات`, `${rows.length} records`)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead className="v8-toolbar text-xs">
                    <tr>
                      <Th>{tx("العميل", "Customer")}</Th>
                      <Th>{tx("الكود", "Code")}</Th>
                      <Th>{tx("الرقم المسجل", "Stored phone")}</Th>
                      <Th>{tx("المصدر", "Source")}</Th>
                      <Th>{tx("الحالة", "Status")}</Th>
                      <Th>{tx("المسؤول", "Owner")}</Th>
                      <Th>{tx("تاريخ الإنشاء", "Created at")}</Th>
                      <Th>{tx("فتح", "Open")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((lead) => {
                      const owner = lead.owner_id ? profileMap.get(lead.owner_id) : null;
                      return (
                        <tr key={lead.id}>
                          <Td className="font-semibold">{lead.full_name ?? tx("بدون اسم", "No name")}</Td>
                          <Td>{lead.customer_code ?? "-"}</Td>
                          <Td><span dir="ltr">{rawPhone(lead) || "-"}</span></Td>
                          <Td>{lead.source ?? "-"}</Td>
                          <Td>{lead.customer_status ?? lead.status ?? "-"}</Td>
                          <Td>{owner?.full_name ?? owner?.email ?? tx("غير موزع", "Unassigned")}</Td>
                          <Td>{formatDate(lead.created_at, locale)}</Td>
                          <Td>
                            <Link href={customerHref(lead)} className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                              <ExternalLink className="h-4 w-4" />
                              {tx("عرض", "View")}
                            </Link>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))}

          {!visibleGroups.length ? (
            <div className="py-14 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="v8-heading mt-3 font-semibold">
                {search
                  ? tx("لا توجد نتائج مطابقة", "No matching results")
                  : tx("لا توجد أرقام مكررة محتملة", "No potential duplicate phones")}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="v8-card rounded-md p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-emerald-600">{icon}</span>
        <span className="v8-heading text-2xl font-bold">{value}</span>
      </div>
      <p className="v8-muted mt-3 text-xs">{label}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap border-b px-3 py-3 text-start font-semibold" style={{ borderColor: "var(--v8-border)" }}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-t px-3 py-3 align-top ${className}`} style={{ borderColor: "var(--v8-border)" }}>{children}</td>;
}
