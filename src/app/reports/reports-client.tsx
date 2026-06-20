"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Loader2, PieChart, RefreshCw, UsersRound } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { CompletedTasksBars, DistributionBars, SourceDonut } from "./report-charts";
import type { ReportTab, ReportsPayload } from "./reports-types";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: isoDate(from), to: isoDate(to) };
}

function emptyPayload(): ReportsPayload {
  return {
    status: "success",
    summary: { customers: 0, sources: 0, distributed: 0, completedTasks: 0 },
    sources: [],
    distribution: [],
    completedTasks: [],
  };
}

export function ReportsClient({ initialTab = "sources" }: { initialTab?: ReportTab }) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const tx = (ar: string, en: string) => (isArabic ? ar : en);
  const range = useMemo(defaultRange, []);

  const [tab, setTab] = useState<ReportTab>(initialTab);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [connection, setConnection] = useState("");
  const [dataType, setDataType] = useState<"all" | "new">("all");
  const [payload, setPayload] = useState<ReportsPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from, to, dataType });
      if (connection) params.set("connection", connection);
      const response = await fetch(`/api/v1/reports/overview?${params.toString()}`, { cache: "no-store" });
      const result = (await response.json()) as ReportsPayload;
      if (!response.ok || result.status !== "success") {
        setError(result.message ?? tx("تعذر تحميل التقارير.", "Unable to load reports."));
        return;
      }
      setPayload(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : tx("حدث خطأ غير متوقع.", "Unexpected error."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  function downloadCsv() {
    const rows: string[][] = [];
    if (tab === "sources") {
      rows.push([tx("المصدر", "Source"), tx("العدد", "Count")]);
      payload.sources.forEach((item) => rows.push([item.name, String(item.value)]));
    } else if (tab === "distribution") {
      rows.push([tx("الموظف", "Employee"), tx("جديد", "Fresh"), tx("إعادة استهداف", "Retargeted"), tx("محوّل", "Redirected"), tx("الإجمالي", "Total")]);
      payload.distribution.forEach((item) => rows.push([item.name, String(item.fresh), String(item.retargeted), String(item.redirected), String(item.total)]));
    } else {
      rows.push([tx("الموظف", "Employee"), tx("المهام المكتملة", "Completed tasks")]);
      payload.completedTasks.forEach((item) => rows.push([item.name, String(item.count)]));
    }

    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `elitecrm-${tab}-${from}-${to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<UsersRound className="h-5 w-5 text-emerald-600" />} label={tx("العملاء خلال الفترة", "Customers in range")} value={payload.summary.customers} />
        <Metric icon={<PieChart className="h-5 w-5 text-blue-600" />} label={tx("مصادر البيانات", "Data sources")} value={payload.summary.sources} />
        <Metric icon={<BarChart3 className="h-5 w-5 text-violet-600" />} label={tx("العملاء الموزعون", "Distributed customers")} value={payload.summary.distributed} />
        <Metric icon={<BarChart3 className="h-5 w-5 text-orange-500" />} label={tx("المهام المكتملة", "Completed tasks")} value={payload.summary.completedTasks} />
      </section>

      <section className="v8-card rounded-md p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="v8-heading text-xl font-semibold">{tx("مركز التقارير والتحليلات", "Reports and analytics center")}</h2>
            <p className="v8-muted mt-1 text-sm">{tx("تقارير مصادر العملاء والتوزيع والمهام المكتملة في شاشة موحدة.", "Customer sources, distribution, and completed tasks in one workspace.")}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Field label={tx("من", "From")}><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="v8-input w-full rounded border px-3 py-2 text-sm" /></Field>
            <Field label={tx("إلى", "To")}><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="v8-input w-full rounded border px-3 py-2 text-sm" /></Field>
            <Field label={tx("نوع البيانات", "Data type")}>
              <select value={dataType} onChange={(event) => setDataType(event.target.value as "all" | "new")} className="v8-input w-full rounded border px-3 py-2 text-sm">
                <option value="all">{tx("كل البيانات", "All data")}</option>
                <option value="new">{tx("البيانات الجديدة فقط", "New data only")}</option>
              </select>
            </Field>
            <Field label={tx("نوع الاتصال", "Connection type")}>
              <select value={connection} onChange={(event) => setConnection(event.target.value)} className="v8-input w-full rounded border px-3 py-2 text-sm">
                <option value="">{tx("الكل", "All")}</option>
                <option value="distributed">{tx("موزع", "Distributed")}</option>
                <option value="ivr">{tx("رد آلي", "IVR")}</option>
                <option value="manual">{tx("إدخال يدوي", "Manual")}</option>
                <option value="redirected">{tx("محوّل", "Redirected")}</option>
              </select>
            </Field>
            <button type="button" onClick={() => void loadReports()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {tx("تحديث", "Refresh")}
            </button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      </section>

      <section className="v8-card rounded-md">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between" style={{ borderColor: "var(--v8-border)" }}>
          <div className="flex flex-wrap gap-2">
            <Tab active={tab === "sources"} onClick={() => setTab("sources")}>{tx("مصادر البيانات", "Data sources")}</Tab>
            <Tab active={tab === "distribution"} onClick={() => setTab("distribution")}>{tx("توزيع البيانات", "Data distribution")}</Tab>
            <Tab active={tab === "tasks"} onClick={() => setTab("tasks")}>{tx("المهام المكتملة", "Completed tasks")}</Tab>
          </div>
          <button type="button" onClick={downloadCsv} className="v8-button inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-semibold">
            <Download className="h-4 w-4" />
            {tx("تصدير CSV", "Export CSV")}
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : tab === "sources" ? (
            <SourceDonut data={payload.sources} emptyText={tx("لا توجد بيانات مصادر في الفترة المحددة.", "No source data in the selected range.")} totalLabel={tx("إجمالي العملاء", "Total customers")} />
          ) : tab === "distribution" ? (
            <DistributionBars data={payload.distribution} emptyText={tx("لا توجد بيانات توزيع في الفترة المحددة.", "No distribution data in the selected range.")} labels={{ fresh: tx("جديد", "Fresh"), retargeted: tx("إعادة استهداف", "Retargeted"), redirected: tx("محوّل", "Redirected") }} />
          ) : (
            <CompletedTasksBars data={payload.completedTasks} emptyText={tx("لا توجد مهام مكتملة في الفترة المحددة.", "No completed tasks in the selected range.")} />
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="v8-card rounded-md p-4"><div className="flex items-center justify-between">{icon}<strong className="v8-heading text-2xl">{value}</strong></div><p className="v8-muted mt-3 text-xs">{label}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="v8-heading mb-1.5 block text-xs font-semibold">{label}</span>{children}</label>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded px-4 py-2 text-sm font-semibold transition ${active ? "bg-[#29455f] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{children}</button>;
}
