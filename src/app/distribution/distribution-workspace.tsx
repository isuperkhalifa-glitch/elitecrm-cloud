"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
  Send,
  Shuffle,
  UserMinus,
  UsersRound,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";

type Lead = {
  id: string;
  customer_code?: string | null;
  full_name: string | null;
  phone: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  status: string | null;
  owner_id: string | null;
  program: string | null;
  assigned_at: string | null;
  customer_status: string | null;
  created_at: string;
  queue_type?: string | null;
  next_follow_up_at?: string | null;
  call_deadline_at?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
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

type Action = "assign" | "unassign" | "auto";

function dateValue(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function phoneValue(lead: Lead) {
  return lead.phone_number
    ? `${lead.country_code ?? ""} ${lead.phone_number}`.trim()
    : lead.phone ?? "-";
}

function customerUrl(lead: Lead) {
  return `/customers/${encodeURIComponent(lead.customer_code || lead.id)}`;
}

export function DistributionWorkspace(props: Props) {
  const { initialLeads, profiles, userEmail, fullName, role } = props;
  const { language } = useI18n();
  const ar = language === "ar";
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const locale = ar ? "ar-SA" : "en-US";

  const agents = useMemo(
    () => profiles.filter((item) => item.is_active !== false && ["sales", "manager"].includes(item.role ?? "")),
    [profiles]
  );
  const profileMap = useMemo(() => new Map(profiles.map((item) => [item.id, item])), [profiles]);

  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [assignment, setAssignment] = useState("unassigned");
  const [queue, setQueue] = useState("all");
  const [owner, setOwner] = useState("all");
  const [target, setTarget] = useState("");
  const [pool, setPool] = useState<string[]>(agents.map((item) => item.id));
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<Action | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (assignment === "unassigned" && lead.owner_id) return false;
      if (assignment === "assigned" && !lead.owner_id) return false;
      if (queue !== "all" && (lead.queue_type ?? "manual") !== queue) return false;
      if (owner !== "all" && lead.owner_id !== owner) return false;
      if (!keyword) return true;
      const ownerProfile = profileMap.get(lead.owner_id ?? "");
      return [
        lead.customer_code,
        lead.full_name,
        phoneValue(lead),
        lead.email,
        lead.company_name,
        lead.source,
        lead.program,
        lead.customer_status,
        ownerProfile?.full_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [leads, assignment, queue, owner, search, profileMap]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rowIds = rows.map((item) => item.id);
  const pageSelected = rowIds.length > 0 && rowIds.every((id) => selected.includes(id));

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: leads.length,
      waiting: leads.filter((lead) => !lead.owner_id).length,
      assigned: leads.filter((lead) => Boolean(lead.owner_id)).length,
      overdue: leads.filter((lead) => {
        const due = dateValue(lead.call_deadline_at ?? lead.next_follow_up_at);
        return Boolean(due && due.getTime() < now);
      }).length,
    };
  }, [leads]);

  const workload = useMemo(() => {
    const now = Date.now();
    const today = new Date().toDateString();
    return agents
      .map((agent) => {
        const owned = leads.filter((lead) => lead.owner_id === agent.id);
        const overdue = owned.filter((lead) => {
          const due = dateValue(lead.call_deadline_at ?? lead.next_follow_up_at);
          return Boolean(due && due.getTime() < now);
        }).length;
        const dueToday = owned.filter((lead) => {
          const due = dateValue(lead.call_deadline_at ?? lead.next_follow_up_at);
          return Boolean(due && due.toDateString() === today);
        }).length;
        return { agent, count: owned.length, overdue, dueToday };
      })
      .sort((a, b) => a.count - b.count);
  }, [agents, leads]);

  function ownerName(id?: string | null) {
    if (!id) return t("غير موزع", "Unassigned");
    const item = profileMap.get(id);
    return item?.full_name ?? item?.email ?? id;
  }

  function queueName(value?: string | null) {
    const map: Record<string, [string, string]> = {
      manual: ["يدوي", "Manual"],
      import: ["استيراد", "Import"],
      campaign: ["حملة", "Campaign"],
      retargeting: ["إعادة استهداف", "Retargeting"],
    };
    const item = map[value ?? "manual"] ?? map.manual;
    return t(item[0], item[1]);
  }

  function formatDate(value?: string | null) {
    const date = dateValue(value);
    return date ? date.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" }) : "-";
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function togglePage() {
    setSelected((current) =>
      pageSelected
        ? current.filter((id) => !rowIds.includes(id))
        : Array.from(new Set([...current, ...rowIds]))
    );
  }

  function togglePool(id: string) {
    setPool((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function execute(action: Action, ids = selected) {
    setError("");
    setMessage("");
    if (!ids.length) return setError(t("اختر عميلًا واحدًا على الأقل.", "Select at least one customer."));
    if (action === "assign" && !target) return setError(t("اختر موظف المبيعات المستلم.", "Choose the receiving sales user."));
    if (action === "auto" && !pool.length) return setError(t("اختر فريق التوزيع التلقائي.", "Choose the automatic distribution pool."));

    setBusy(action);
    try {
      const response = await fetch("/api/v1/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lead_ids: ids, target_user_id: target || null, agent_ids: pool }),
      });
      const result = await response.json();
      if (!response.ok) return setError(result.message ?? t("تعذر تنفيذ العملية.", "Operation failed."));

      const updated = (result.data ?? []) as Lead[];
      const updatedMap = new Map(updated.map((lead) => [lead.id, lead]));
      setLeads((current) => current.map((lead) => updatedMap.get(lead.id) ?? lead));
      setSelected((current) => current.filter((id) => !ids.includes(id)));
      setMessage(result.message ?? t("تم التنفيذ بنجاح.", "Completed successfully."));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("حدث خطأ غير متوقع.", "Unexpected error."));
    } finally {
      setBusy("");
    }
  }

  function reset() {
    setSearch("");
    setAssignment("unassigned");
    setQueue("all");
    setOwner("all");
    setSelected([]);
    setPage(1);
  }

  return (
    <AppShell titleKey="distribution" userEmail={userEmail} fullName={fullName} role={role}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label={t("إجمالي العملاء", "Total customers")} value={stats.total} />
          <Metric label={t("في الانتظار", "Waiting")} value={stats.waiting} />
          <Metric label={t("تم توزيعهم", "Assigned")} value={stats.assigned} />
          <Metric label={t("متابعات متأخرة", "Overdue follow-ups")} value={stats.overdue} />
        </div>

        <section className="v8-card rounded-md p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--v8-border)" }}>
            <div>
              <h2 className="v8-heading text-xl font-semibold">{t("مركز التوزيع والتشغيل", "Distribution operations center")}</h2>
              <p className="v8-muted mt-1 text-sm">{t("الطوابير والتوزيع وإعادة التحويل في شاشة واحدة.", "Queues, assignment, and transfers in one workspace.")}</p>
            </div>
            <button type="button" onClick={reset} className="v8-button rounded px-3 py-2 text-sm">{t("مسح الفلاتر", "Clear filters")}</button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Field label={t("بحث", "Search")} wide>
              <div className="relative"><Search className="v8-muted absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="v8-input w-full rounded border py-2.5 pe-3 ps-9 text-sm" placeholder={t("اسم، رقم، مصدر، دورة", "Name, phone, source, course")} /></div>
            </Field>
            <Field label={t("حالة التوزيع", "Assignment status")}><select value={assignment} onChange={(event) => { setAssignment(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2.5 text-sm"><option value="unassigned">{t("غير موزعين", "Unassigned")}</option><option value="assigned">{t("موزعين", "Assigned")}</option><option value="all">{t("الكل", "All")}</option></select></Field>
            <Field label={t("نوع الطابور", "Queue type")}><select value={queue} onChange={(event) => { setQueue(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2.5 text-sm"><option value="all">{t("كل الطوابير", "All queues")}</option>{["manual", "import", "campaign", "retargeting"].map((value) => <option key={value} value={value}>{queueName(value)}</option>)}</select></Field>
            <Field label={t("الموظف الحالي", "Current owner")}><select value={owner} onChange={(event) => { setOwner(event.target.value); setPage(1); }} className="v8-input w-full rounded border px-3 py-2.5 text-sm"><option value="all">{t("كل الموظفين", "All users")}</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name ?? agent.email ?? agent.id}</option>)}</select></Field>
          </div>
        </section>

        <section className="v8-card rounded-md p-5">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
            <div>
              <h3 className="v8-heading font-semibold">{t("إجراءات التوزيع", "Distribution actions")}</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
                <Field label={t("الموظف المستلم", "Receiving user")}><select value={target} onChange={(event) => setTarget(event.target.value)} className="v8-input w-full rounded border px-3 py-2.5 text-sm"><option value="">{t("اختر موظف المبيعات", "Choose sales user")}</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name ?? agent.email ?? agent.id}</option>)}</select></Field>
                <ActionButton disabled={Boolean(busy) || !selected.length} onClick={() => execute("assign")} icon={busy === "assign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}>{t("توزيع", "Assign")}</ActionButton>
                <ActionButton disabled={Boolean(busy) || !selected.length} onClick={() => execute("auto")} icon={busy === "auto" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}>{t("تلقائي", "Auto")}</ActionButton>
                <ActionButton disabled={Boolean(busy) || !selected.length} onClick={() => execute("unassign")} danger icon={busy === "unassign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}>{t("إلغاء", "Unassign")}</ActionButton>
              </div>
              <p className="v8-muted mt-2 text-xs">{t(`المحدد: ${selected.length} عميل`, `Selected: ${selected.length} customers`)}</p>
            </div>

            <div>
              <div className="flex items-center justify-between"><h3 className="v8-heading font-semibold">{t("فريق التوزيع التلقائي", "Automatic pool")}</h3><button type="button" onClick={() => setPool(pool.length === agents.length ? [] : agents.map((item) => item.id))} className="text-xs font-semibold text-emerald-700 hover:underline">{pool.length === agents.length ? t("إلغاء الكل", "Clear all") : t("تحديد الكل", "Select all")}</button></div>
              <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{agents.map((agent) => <label key={agent.id} className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-xs ${pool.includes(agent.id) ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}><input type="checkbox" checked={pool.includes(agent.id)} onChange={() => togglePool(agent.id)} />{agent.full_name ?? agent.email ?? agent.id}</label>)}</div>
            </div>
          </div>
          {error ? <Notice error>{error}</Notice> : null}
          {message ? <Notice>{message}</Notice> : null}
        </section>

        <section className="v8-card rounded-md p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="v8-heading font-semibold">{t("قائمة العملاء", "Customer queue")}</h3><p className="v8-muted mt-1 text-xs">{t(`النتائج: ${filtered.length}`, `Results: ${filtered.length}`)}</p></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="v8-input rounded border px-2 py-2 text-sm">{[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
          <div className="overflow-x-auto border-y" style={{ borderColor: "var(--v8-border)" }}>
            <table className="w-full min-w-[1400px] border-collapse text-sm"><thead className="v8-toolbar text-xs"><tr><Th><input type="checkbox" checked={pageSelected} onChange={togglePage} /></Th><Th>{t("العميل", "Customer")}</Th><Th>{t("الرقم", "Phone")}</Th><Th>{t("المصدر", "Source")}</Th><Th>{t("الدورة", "Course")}</Th><Th>{t("الطابور", "Queue")}</Th><Th>{t("الحالة", "Status")}</Th><Th>{t("المسؤول", "Owner")}</Th><Th>{t("التوزيع", "Assigned at")}</Th><Th>{t("المتابعة", "Follow-up")}</Th><Th>{t("فتح", "Open")}</Th></tr></thead>
              <tbody>{rows.map((lead) => <tr key={lead.id} className={selected.includes(lead.id) ? "bg-emerald-50/70" : ""}><Td><input type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggle(lead.id)} /></Td><Td><p className="v8-heading font-semibold">{lead.full_name ?? t("بدون اسم", "No name")}</p><p className="v8-muted text-xs">{lead.customer_code ?? lead.id.slice(0, 8)}</p></Td><Td><span dir="ltr">{phoneValue(lead)}</span></Td><Td>{lead.source ?? "-"}</Td><Td>{lead.program ?? "-"}</Td><Td>{queueName(lead.queue_type)}</Td><Td>{lead.customer_status ?? lead.status ?? "-"}</Td><Td>{ownerName(lead.owner_id)}</Td><Td>{formatDate(lead.assigned_at)}</Td><Td>{formatDate(lead.call_deadline_at ?? lead.next_follow_up_at)}</Td><Td><Link href={customerUrl(lead)} className="v8-button inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs"><ExternalLink className="h-3.5 w-3.5" />{t("عرض", "View")}</Link></Td></tr>)}{!rows.length ? <tr><td colSpan={11} className="v8-muted py-14 text-center">{t("لا توجد نتائج", "No results")}</td></tr> : null}</tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm"><span className="v8-muted">{t(`عرض ${rows.length} من ${filtered.length}`, `Showing ${rows.length} of ${filtered.length}`)}</span><div className="flex items-center gap-2"><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="v8-button rounded p-2 disabled:opacity-40">{ar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button><span className="v8-heading min-w-20 text-center font-semibold">{safePage} / {pages}</span><button type="button" disabled={safePage >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className="v8-button rounded p-2 disabled:opacity-40">{ar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button></div></div>
        </section>

        <section className="v8-card rounded-md p-5"><h3 className="v8-heading font-semibold">{t("أحمال فريق المبيعات", "Sales workloads")}</h3><p className="v8-muted mt-1 text-xs">{t("التوزيع التلقائي يبدأ بالأقل حملًا.", "Automatic distribution starts with the lowest workload.")}</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-sm"><thead className="v8-toolbar text-xs"><tr><Th>{t("الموظف", "User")}</Th><Th>{t("العملاء", "Customers")}</Th><Th>{t("اليوم", "Due today")}</Th><Th>{t("متأخر", "Overdue")}</Th></tr></thead><tbody>{workload.map((item) => <tr key={item.agent.id}><Td className="font-semibold">{item.agent.full_name ?? item.agent.email ?? item.agent.id}</Td><Td>{item.count}</Td><Td>{item.dueToday}</Td><Td>{item.overdue}</Td></tr>)}</tbody></table></div></section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="v8-card rounded-md p-4"><div className="flex items-center justify-between"><UsersRound className="h-5 w-5 text-emerald-600" /><strong className="v8-heading text-2xl">{value}</strong></div><p className="v8-muted mt-3 text-xs">{label}</p></div>;
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? "xl:col-span-2" : ""}><span className="v8-heading mb-1.5 block text-xs font-semibold">{label}</span>{children}</label>;
}

function ActionButton({ children, icon, disabled, onClick, danger = false }: { children: ReactNode; icon: ReactNode; disabled: boolean; onClick: () => void; danger?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded border px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${danger ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>{icon}{children}</button>;
}

function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`mt-4 flex items-start gap-2 rounded border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ? <XCircle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}{children}</div>;
}

function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap border-b px-3 py-3 text-start font-semibold" style={{ borderColor: "var(--v8-border)" }}>{children}</th>;
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-t px-3 py-3 align-top ${className}`} style={{ borderColor: "var(--v8-border)" }}>{children}</td>;
}
