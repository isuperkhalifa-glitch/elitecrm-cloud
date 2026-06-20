"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import type { CustomerLead } from "./customer-operations-types";

type Props = {
  leads: CustomerLead[];
  canTransfer: boolean;
  selectedIds: string[];
  allPageSelected: boolean;
  page: number;
  totalPages: number;
  isArabic: boolean;
  tx: (ar: string, en: string) => string;
  onToggleRow: (id: string) => void;
  onTogglePage: () => void;
  onPage: (page: number) => void;
  statusLabel: (value?: string | null) => string;
  connectionLabel: (value?: string | null) => string;
  ownerName: (id?: string | null) => string;
  inferredConnection: (lead: CustomerLead) => string;
  formatDate: (value?: string | null) => string;
};

function phoneDisplay(lead: CustomerLead) {
  if (lead.phone_number) return `${lead.country_code ?? ""} ${lead.phone_number}`.trim();
  return lead.phone ?? "-";
}

function customerHref(lead: CustomerLead) {
  return `/customers/${encodeURIComponent(lead.customer_code || lead.id)}`;
}

export function CustomerOperationsTable({
  leads,
  canTransfer,
  selectedIds,
  allPageSelected,
  page,
  totalPages,
  isArabic,
  tx,
  onToggleRow,
  onTogglePage,
  onPage,
  statusLabel,
  connectionLabel,
  ownerName,
  inferredConnection,
  formatDate,
}: Props) {
  return (
    <section className="v8-card overflow-hidden rounded-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1350px] border-collapse text-sm">
          <thead className="v8-toolbar text-xs">
            <tr>
              {canTransfer ? <Th><input type="checkbox" checked={allPageSelected} onChange={onTogglePage} aria-label={tx("تحديد الصفحة", "Select page")} /></Th> : null}
              <Th>{tx("الكود", "Code")}</Th>
              <Th>{tx("العميل", "Customer")}</Th>
              <Th>{tx("الجوال", "Phone")}</Th>
              <Th>{tx("الدورة", "Course")}</Th>
              <Th>{tx("المصدر", "Source")}</Th>
              <Th>{tx("نوع الاتصال", "Connection")}</Th>
              <Th>{tx("الحالة", "Status")}</Th>
              <Th>{tx("المسؤول", "Owner")}</Th>
              <Th>{tx("المتابعة", "Follow-up")}</Th>
              <Th>{tx("الإجراء", "Action")}</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const status = lead.customer_status ?? lead.status;
              return (
                <tr key={lead.id} className={selectedIds.includes(lead.id) ? "bg-emerald-50/70" : ""}>
                  {canTransfer ? <Td><input type="checkbox" checked={selectedIds.includes(lead.id)} onChange={() => onToggleRow(lead.id)} /></Td> : null}
                  <Td><span className="font-mono text-xs text-emerald-700" dir="ltr">{lead.customer_code ?? lead.id.slice(0, 8)}</span></Td>
                  <Td>
                    <p className="v8-heading font-semibold">{lead.full_name ?? tx("بدون اسم", "No name")}</p>
                    <p className="v8-muted mt-1 text-xs">{lead.email ?? lead.company_name ?? "-"}</p>
                  </Td>
                  <Td><span dir="ltr">{phoneDisplay(lead)}</span></Td>
                  <Td>{lead.program ?? lead.course_name ?? "-"}</Td>
                  <Td>{lead.source ?? "-"}</Td>
                  <Td>{connectionLabel(inferredConnection(lead))}</Td>
                  <Td>{statusLabel(status)}</Td>
                  <Td>{ownerName(lead.owner_id)}</Td>
                  <Td>{formatDate(lead.next_follow_up_at)}</Td>
                  <Td>
                    <Link href={customerHref(lead)} className="v8-button inline-flex items-center gap-1 rounded px-3 py-2 text-xs font-semibold">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {tx("فتح", "Open")}
                    </Link>
                  </Td>
                </tr>
              );
            })}
            {!leads.length ? (
              <tr>
                <td colSpan={canTransfer ? 11 : 10} className="v8-muted py-14 text-center">
                  <UsersRound className="mx-auto mb-3 h-8 w-8" />
                  {tx("لا يوجد عملاء مطابقون للفلاتر الحالية.", "No customers match the current filters.")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between" style={{ borderColor: "var(--v8-border)" }}>
        <p className="v8-muted text-sm">{tx(`صفحة ${page} من ${totalPages}`, `Page ${page} of ${totalPages}`)}</p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="v8-button inline-flex items-center gap-2 rounded px-4 py-2 text-sm disabled:opacity-40">
            {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {tx("السابق", "Previous")}
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="v8-button inline-flex items-center gap-2 rounded px-4 py-2 text-sm disabled:opacity-40">
            {tx("التالي", "Next")}
            {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap border-b px-3 py-3 text-start font-semibold" style={{ borderColor: "var(--v8-border)" }}>{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="border-t px-3 py-3 align-top" style={{ borderColor: "var(--v8-border)" }}>{children}</td>;
}
