"use client";

import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";

type DashboardClientProps = {
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
  stats: {
    companies: number;
    contacts: number;
    leads: number;
    deals: number;
    tasks: number;
    invoices: number;
    commissions: number;
  };
};

export function DashboardClient({
  userEmail,
  fullName,
  role,
  stats,
}: DashboardClientProps) {
  const { t } = useI18n();

  const cards = [
    { label: t("totalCompanies"), value: stats.companies },
    { label: t("totalContacts"), value: stats.contacts },
    { label: t("totalLeads"), value: stats.leads },
    { label: t("totalDeals"), value: stats.deals },
    { label: t("totalTasks"), value: stats.tasks },
    { label: t("totalInvoices"), value: stats.invoices },
    { label: t("totalCommissions"), value: stats.commissions },
  ];

  return (
    <AppShell
      titleKey="dashboard"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <section className="safe-card mb-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6 text-emerald-100">
        <p className="text-sm text-emerald-300">{t("systemStatus")}</p>
        <h2 className="mt-2 text-2xl font-bold">{t("activeSystem")}</h2>
        <p className="mt-2 text-sm text-emerald-100/80">{t("protectedArea")}</p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <h3 className="mt-3 text-4xl font-bold">{card.value}</h3>
          </div>
        ))}
      </section>
    </AppShell>
  );
}

