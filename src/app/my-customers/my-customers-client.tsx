"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";
import { usePageText, useSettingOptions } from "@/components/page-settings";
import { createClient } from "@/lib/supabase/client";
import { useSystemSettings } from "@/components/system-settings-provider";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  Send,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import { getLeadStatusClass, getLeadStatusLabel, leadStatusValues } from "@/lib/crm/customer-core";

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
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  last_note: string | null;
  customer_status: string | null;
  registration_status: string | null;
  payment_status: string | null;
  transfer_reason: string | null;
  transferred_at: string | null;
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

const customerStatuses = [...leadStatusValues];

function normalizePhone(phone: string | null) {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function isToday(value: string | null) {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
}

function isOverdue(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date < now && date.toDateString() !== now.toDateString();
}

export function MyCustomersClient({
  initialLeads,
  profiles,
  currentUserId,
  userEmail,
  fullName,
  role,
}: Props) {
  const { language } = useI18n();
  const { scope } = useScope();
  const isArabic = language === "ar";
  const isAdmin = role === "admin" || role === "manager";

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [followupDrafts, setFollowupDrafts] = useState<Record<string, string>>({});
  const [transferDrafts, setTransferDrafts] = useState<Record<string, { to: string; reason: string }>>({});

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  const { getBooleanSetting } = useSystemSettings();
  const transfersEnabled = getBooleanSetting("features.transfers.enabled", true);
  const customerStatusesFromSettings = useSettingOptions("crm.customer_statuses", customerStatuses);
  const pageTitle = usePageText("pages.my-customers.title", "عملائي", "My Customers");
  const pageDescription = usePageText(
    "pages.my-customers.description",
    "مساحة متابعة العملاء للسيلز: ملاحظات، مواعيد متابعة، حالات، وتحويلات.",
    "Sales workspace for notes, follow-ups, statuses, and transfers."
  );
  const effectiveUserId =
    isAdmin && scope.mode === "user" && scope.targetId ? scope.targetId : currentUserId;

  const salesProfiles = profiles.filter((profile) =>
    ["sales", "admin", "manager"].includes(profile.role ?? "")
  );

  const scopedLeads = useMemo(() => {
    return leads.filter((lead) => lead.owner_id === effectiveUserId);
  }, [leads, effectiveUserId]);

  const filteredLeads = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return scopedLeads.filter((lead) => {
      const matchesStatus =
        statusFilter === "all" ||
        (lead.customer_status ?? lead.status) === statusFilter ||
        lead.payment_status === statusFilter ||
        lead.registration_status === statusFilter;

      const matchesKeyword =
        !keyword ||
        [
          lead.full_name,
          lead.phone,
          lead.email,
          lead.company_name,
          lead.source,
          lead.program,
          lead.last_note,
          lead.customer_status,
          lead.payment_status,
          lead.registration_status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [scopedLeads, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: scopedLeads.length,
      today: scopedLeads.filter((lead) => isToday(lead.next_follow_up_at)).length,
      overdue: scopedLeads.filter((lead) => isOverdue(lead.next_follow_up_at)).length,
      interested: scopedLeads.filter((lead) =>
        ["interested", "follow_up", "contacted"].includes(lead.customer_status ?? lead.status ?? "")
      ).length,
      paid: scopedLeads.filter((lead) => lead.payment_status === "paid").length,
    };
  }, [scopedLeads]);

  function statusLabel(value: string | null) {
    const extra: Record<string, string> = {
      registered: tx("مسجل", "Registered"),
      unpaid: tx("غير مدفوع", "Unpaid"),
      partial: tx("دفع جزئي", "Partial"),
      not_registered: tx("غير مسجل", "Not registered"),
    };

    return extra[value ?? ""] ?? getLeadStatusLabel(value, language);
  }

  function dateLabel(value: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusClass(value: string | null) {
    if (value === "paid" || value === "registered") return "bg-emerald-400/10 text-emerald-300";
    if (value === "interested" || value === "follow_up" || value === "contacted") return "bg-sky-400/10 text-sky-300";
    if (value === "no_answer" || value === "wrong_number" || value === "not_interested" || value === "canceled") return "bg-red-500/10 text-red-300";
    return "bg-yellow-400/10 text-yellow-300";
  }

  async function updateLead(leadId: string, patch: Partial<Lead>) {
    setMessage("");
    setError("");
    setSavingId(leadId);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("leads")
      .update(patch)
      .eq("id", leadId)
      .select("*")
      .single();

    if (error || !data) {
      setError(error?.message ?? tx("تعذر تحديث العميل.", "Unable to update customer."));
      setSavingId("");
      return;
    }

    setLeads((current) =>
      current.map((lead) => (lead.id === leadId ? (data as unknown as Lead) : lead))
    );

    setMessage(tx("تم تحديث العميل.", "Customer updated."));
    setSavingId("");
  }

  async function changeStatus(lead: Lead, nextStatus: string) {
    const patch: Partial<Lead> = {
      status: nextStatus,
      customer_status: nextStatus,
      last_contact_at: ["interested", "need_offer", "busy", "paid"].includes(nextStatus)
        ? new Date().toISOString()
        : lead.last_contact_at,
    };

    if (nextStatus === "paid") {
      patch.registration_status = "registered";
      patch.payment_status = "paid";
    }

    await updateLead(lead.id, patch);
  }

  async function saveNote(lead: Lead) {
    const value = noteDrafts[lead.id] ?? lead.last_note ?? "";

    await updateLead(lead.id, {
      last_note: value,
      last_contact_at: new Date().toISOString(),
    });
  }

  async function saveFollowup(lead: Lead) {
    const value = followupDrafts[lead.id];

    if (!value) {
      setError(tx("اختار تاريخ المتابعة.", "Choose a follow-up date."));
      return;
    }

    await updateLead(lead.id, {
      next_follow_up_at: new Date(value).toISOString(),
      customer_status: "busy",
      status: "busy",
    });
  }

  async function transferLead(lead: Lead) {
    const transfer = transferDrafts[lead.id];

    if (!transfer?.to) {
      setError(tx("اختار السيلز الجديد.", "Choose the new sales user."));
      return;
    }

    await updateLead(lead.id, {
      owner_id: transfer.to,
      transferred_from: lead.owner_id,
      transferred_to: transfer.to,
      transfer_reason: transfer.reason || tx("تحويل من مساحة عمل السيلز", "Transferred from sales workspace"),
      transferred_at: new Date().toISOString(),
      assigned_at: new Date().toISOString(),
      lead_type: "redirected",
    } as Partial<Lead>);
  }

  function StatCard({
    title,
    value,
    icon: Icon,
    tone = "default",
  }: {
    title: string;
    value: string | number;
    icon: any;
    tone?: "default" | "green" | "red" | "blue" | "yellow";
  }) {
    const toneClass =
      tone === "green"
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
        : tone === "red"
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : tone === "blue"
            ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
            : tone === "yellow"
              ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
              : "border-white/10 bg-white/[0.04] text-white";

    return (
      <div className={`safe-card rounded-[2rem] border p-5 ${toneClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm opacity-80">{title}</p>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-3xl font-black">{value}</h2>
      </div>
    );
  }

  return (
    <AppShell
      titleKey="myCustomers"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title={tx("عملائي", "My customers")} value={stats.total} icon={UsersRound} />
        <StatCard title={tx("متابعات اليوم", "Today follow-ups")} value={stats.today} icon={CalendarClock} tone="blue" />
        <StatCard title={tx("متأخرة", "Overdue")} value={stats.overdue} icon={Clock3} tone="red" />
        <StatCard title={tx("مهتمين", "Interested")} value={stats.interested} icon={UserRoundCheck} tone="yellow" />
        <StatCard title={tx("مدفوعين", "Paid")} value={stats.paid} icon={CheckCircle2} tone="green" />
      </div>

      <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-emerald-300">
              {pageDescription}
            </p>
            <h1 className="text-3xl font-black text-white">
              {pageTitle}
            </h1>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 md:min-w-80">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tx("بحث بالاسم، الرقم، البرنامج...", "Search name, phone, program...")}
                className="w-full border-none bg-transparent p-0 text-white outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option value="all">{tx("كل الحالات", "All statuses")}</option>
              {customerStatusesFromSettings.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
              <option value="not_registered">{tx("غير مسجل", "Not registered")}</option>
              <option value="unpaid">{tx("غير مدفوع", "Unpaid")}</option>
              <option value="partial">{tx("دفع جزئي", "Partial")}</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredLeads.map((lead) => {
            const phone = normalizePhone(lead.phone);
            const whatsappPhone = phone.startsWith("+") ? phone.slice(1) : phone;
            const leadStatus = lead.customer_status ?? lead.status ?? "new";

            return (
              <article
                key={lead.id}
                className="elite-motion-card rounded-[2rem] border border-white/10 bg-slate-900/70 p-5"
              >
                <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(leadStatus)}`}>
                        {statusLabel(leadStatus)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs ${statusClass(lead.payment_status)}`}>
                        {statusLabel(lead.payment_status)}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                        {lead.source ?? "-"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-white">
                      {lead.full_name ?? "-"}
                    </h2>

                    <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-2 xl:grid-cols-3">
                      <p dir="ltr">{lead.phone ?? "-"}</p>
                      <p>{lead.program ?? tx("لا يوجد برنامج", "No program")}</p>
                      <p>{lead.company_name ?? tx("بدون شركة", "No company")}</p>
                      <p>{tx("آخر تواصل", "Last contact")}: {dateLabel(lead.last_contact_at)}</p>
                      <p>{tx("المتابعة القادمة", "Next follow-up")}: {dateLabel(lead.next_follow_up_at)}</p>
                      <p>{tx("تاريخ التوزيع", "Assigned")}: {dateLabel(lead.assigned_at)}</p>
                    </div>

                    <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="mb-2 text-xs text-slate-500">{tx("آخر ملاحظة", "Last note")}</p>
                      <textarea
                        value={noteDrafts[lead.id] ?? lead.last_note ?? ""}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [lead.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder={tx("اكتب ملاحظة المتابعة...", "Write follow-up note...")}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={phone ? `tel:${phone}` : "#"}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-300"
                      >
                        <Phone className="h-4 w-4" />
                        {tx("اتصال", "Call")}
                      </a>

                      <a
                        href={whatsappPhone ? `https://wa.me/${whatsappPhone}` : "#"}
                        target="_blank"
                        className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {tx("واتساب", "WhatsApp")}
                      </a>
                    </div>

                    <select
                      value={leadStatus}
                      onChange={(event) => changeStatus(lead, event.target.value)}
                      disabled={savingId === lead.id}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400 disabled:opacity-60"
                    >
                      {customerStatusesFromSettings.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => saveNote(lead)}
                      disabled={savingId === lead.id}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                      type="button"
                    >
                      {savingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {tx("حفظ الملاحظة", "Save note")}
                    </button>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        type="date"
                        value={followupDrafts[lead.id] ?? todayDateInput()}
                        onChange={(event) =>
                          setFollowupDrafts((current) => ({
                            ...current,
                            [lead.id]: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                      />

                      <button
                        onClick={() => saveFollowup(lead)}
                        disabled={savingId === lead.id}
                        className="rounded-2xl border border-white/10 px-4 py-3 text-slate-200 hover:bg-white/10 disabled:opacity-60"
                        type="button"
                      >
                        <CalendarClock className="h-5 w-5" />
                      </button>
                    </div>

                    {transfersEnabled ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="mb-2 text-xs text-slate-500">{tx("تحويل لسيلز آخر", "Transfer to another sales")}</p>

                      <div className="space-y-2">
                        <select
                          value={transferDrafts[lead.id]?.to ?? ""}
                          onChange={(event) =>
                            setTransferDrafts((current) => ({
                              ...current,
                              [lead.id]: {
                                to: event.target.value,
                                reason: current[lead.id]?.reason ?? "",
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                        >
                          <option value="">{tx("اختار السيلز", "Choose sales")}</option>
                          {salesProfiles
                            .filter((profile) => profile.id !== lead.owner_id)
                            .map((profile) => (
                              <option key={profile.id} value={profile.id}>
                                {profile.full_name ?? profile.id}
                              </option>
                            ))}
                        </select>

                        <input
                          value={transferDrafts[lead.id]?.reason ?? ""}
                          onChange={(event) =>
                            setTransferDrafts((current) => ({
                              ...current,
                              [lead.id]: {
                                to: current[lead.id]?.to ?? "",
                                reason: event.target.value,
                              },
                            }))
                          }
                          placeholder={tx("سبب التحويل", "Transfer reason")}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                        />

                        <button
                          onClick={() => transferLead(lead)}
                          disabled={savingId === lead.id}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-400/15 disabled:opacity-60"
                          type="button"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          {tx("تحويل العميل", "Transfer customer")}
                        </button>
                      </div>
                    </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {filteredLeads.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
              {tx("لا يوجد عملاء في هذا النطاق.", "No customers in this scope.")}
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
