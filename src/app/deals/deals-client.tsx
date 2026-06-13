"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/language-provider";
import {
  CalendarDays,
  CircleDollarSign,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  full_name: string;
  company_id: string | null;
};

type Deal = {
  id: string;
  title: string;
  company_id: string | null;
  contact_id: string | null;
  owner_id: string | null;
  stage: string;
  amount: number | null;
  expected_close_date: string | null;
  probability: number | null;
  created_at: string;
  companies?: Company | null;
  contacts?: Contact | null;
};

type DealsClientProps = {
  initialDeals: Deal[];
  companies: Company[];
  contacts: Contact[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type DealForm = {
  title: string;
  company_id: string;
  contact_id: string;
  stage: string;
  amount: string;
  probability: string;
  expected_close_date: string;
};

const stages = [
  { id: "new", color: "bg-slate-400/15 text-slate-200" },
  { id: "contacted", color: "bg-sky-400/15 text-sky-200" },
  { id: "proposal", color: "bg-violet-400/15 text-violet-200" },
  { id: "negotiation", color: "bg-yellow-400/15 text-yellow-200" },
  { id: "won", color: "bg-emerald-400/15 text-emerald-200" },
  { id: "lost", color: "bg-red-400/15 text-red-200" },
];

const emptyForm: DealForm = {
  title: "",
  company_id: "",
  contact_id: "",
  stage: "new",
  amount: "",
  probability: "50",
  expected_close_date: "",
};

export function DealsClient({
  initialDeals,
  companies,
  contacts,
  currentUserId,
  userEmail,
  fullName,
  role,
}: DealsClientProps) {
  const { language } = useI18n();
  const isArabic = language === "ar";
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function stageLabel(stage: string) {
    const labels: Record<string, string> = {
      new: tx("جديدة", "New"),
      contacted: tx("تواصل", "Contacted"),
      proposal: tx("عرض سعر", "Proposal"),
      negotiation: tx("تفاوض", "Negotiation"),
      won: tx("مغلقة ناجحة", "Won"),
      lost: tx("مغلقة مرفوضة", "Lost"),
    };

    return labels[stage] ?? stage;
  }

  function formatMoney(value: number | null) {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(value: string | null) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const filteredDeals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return deals;

    return deals.filter((deal) =>
      [
        deal.title,
        deal.companies?.name,
        deal.contacts?.full_name,
        stageLabel(deal.stage),
        String(deal.amount ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [deals, search, isArabic]);

  const totals = useMemo(() => {
    const totalAmount = deals.reduce(
      (sum, deal) => sum + Number(deal.amount ?? 0),
      0
    );

    const weightedAmount = deals.reduce((sum, deal) => {
      const amount = Number(deal.amount ?? 0);
      const probability = Number(deal.probability ?? 0);

      return sum + amount * (probability / 100);
    }, 0);

    const wonAmount = deals
      .filter((deal) => deal.stage === "won")
      .reduce((sum, deal) => sum + Number(deal.amount ?? 0), 0);

    const openDeals = deals.filter(
      (deal) => deal.stage !== "won" && deal.stage !== "lost"
    ).length;

    return {
      totalAmount,
      weightedAmount,
      wonAmount,
      openDeals,
    };
  }, [deals]);

  const contactsForSelectedCompany = useMemo(() => {
    if (!form.company_id) return contacts;

    return contacts.filter(
      (contact) => !contact.company_id || contact.company_id === form.company_id
    );
  }, [contacts, form.company_id]);

  function updateField(field: keyof DealForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(deal: Deal) {
    setEditingId(deal.id);
    setMessage("");
    setError("");

    setForm({
      title: deal.title ?? "",
      company_id: deal.company_id ?? "",
      contact_id: deal.contact_id ?? "",
      stage: deal.stage ?? "new",
      amount: deal.amount === null ? "" : String(deal.amount),
      probability: deal.probability === null ? "50" : String(deal.probability),
      expected_close_date: deal.expected_close_date
        ? deal.expected_close_date.slice(0, 10)
        : "",
    });
  }

  async function saveDeal() {
    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError(tx("اكتب اسم الصفقة أولًا.", "Please enter the deal title."));
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const payload = {
      title: form.title.trim(),
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      owner_id: currentUserId,
      stage: form.stage,
      amount: form.amount ? Number(form.amount) : null,
      probability: form.probability ? Number(form.probability) : null,
      expected_close_date: form.expected_close_date || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("deals")
        .update(payload)
        .eq("id", editingId)
        .select("id,title,company_id,contact_id,owner_id,stage,amount,expected_close_date,probability,created_at,companies(id,name),contacts(id,full_name,company_id)")
        .single();

      setSaving(false);

      if (error || !data) {
        console.error(error);
        setError(error?.message ?? tx("تعذر حفظ الصفقة.", "Unable to save deal."));
        return;
      }

      setDeals((current) =>
        current.map((deal) => (deal.id === data.id ? (data as unknown as Deal) : deal))
      );

      setMessage(tx("تم تعديل الصفقة بنجاح.", "Deal updated successfully."));
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("deals")
      .insert(payload)
      .select("id,title,company_id,contact_id,owner_id,stage,amount,expected_close_date,probability,created_at,companies(id,name),contacts(id,full_name,company_id)")
      .single();

    setSaving(false);

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? tx("تعذر حفظ الصفقة.", "Unable to save deal."));
      return;
    }

    setDeals((current) => [data as unknown as Deal, ...current]);
    setMessage(tx("تم إضافة الصفقة بنجاح.", "Deal added successfully."));
    resetForm();
  }

  async function deleteDeal(dealId: string) {
    const confirmed = window.confirm(
      tx("هل تريد حذف هذه الصفقة نهائيًا؟", "Delete this deal permanently?")
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase.from("deals").delete().eq("id", dealId);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setDeals((current) => current.filter((deal) => deal.id !== dealId));
    setMessage(tx("تم حذف الصفقة.", "Deal deleted."));
  }

  async function moveDeal(dealId: string, stage: string) {
    const currentDeal = deals.find((deal) => deal.id === dealId);

    if (!currentDeal || currentDeal.stage === stage) return;

    setDeals((current) =>
      current.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal))
    );

    const supabase = createClient();

    const { data, error } = await supabase
      .from("deals")
      .update({ stage })
      .eq("id", dealId)
      .select("id,title,company_id,contact_id,owner_id,stage,amount,expected_close_date,probability,created_at,companies(id,name),contacts(id,full_name,company_id)")
      .single();

    if (error || !data) {
      console.error(error);
      setDeals((current) =>
        current.map((deal) =>
          deal.id === dealId ? { ...deal, stage: currentDeal.stage } : deal
        )
      );
      setError(error?.message ?? tx("تعذر نقل الصفقة.", "Unable to move deal."));
      return;
    }

    setDeals((current) =>
      current.map((deal) => (deal.id === dealId ? (data as unknown as Deal) : deal))
    );
  }

  return (
    <AppShell
      titleKey="deals"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{tx("إجمالي الصفقات", "Total deals")}</p>
          <h2 className="mt-2 text-3xl font-black">{deals.length}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{tx("صفقات مفتوحة", "Open deals")}</p>
          <h2 className="mt-2 text-3xl font-black">{totals.openDeals}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">{tx("القيمة المتوقعة", "Weighted value")}</p>
          <h2 className="mt-2 text-3xl font-black">{formatMoney(totals.weightedAmount)}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-sm text-emerald-300">{tx("مبيعات ناجحة", "Won value")}</p>
          <h2 className="mt-2 text-3xl font-black text-emerald-300">{formatMoney(totals.wonAmount)}</h2>
        </div>
      </div>

      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-300">
                {editingId ? tx("تعديل صفقة", "Edit deal") : tx("إضافة صفقة", "Add deal")}
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {editingId ? tx("بيانات الصفقة", "Deal details") : tx("صفقة جديدة", "New deal")}
              </h2>
            </div>

            <Plus className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">{tx("اسم الصفقة", "Deal title")}</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{tx("الشركة", "Company")}</span>
              <select
                value={form.company_id}
                onChange={(event) => updateField("company_id", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="">{tx("بدون شركة", "No company")}</option>
                {companies.map((company) => (
                  <option value={company.id} key={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{tx("جهة الاتصال", "Contact")}</span>
              <select
                value={form.contact_id}
                onChange={(event) => updateField("contact_id", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="">{tx("بدون جهة اتصال", "No contact")}</option>
                {contactsForSelectedCompany.map((contact) => (
                  <option value={contact.id} key={contact.id}>
                    {contact.full_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{tx("المرحلة", "Stage")}</span>
                <select
                  value={form.stage}
                  onChange={(event) => updateField("stage", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {stages.map((stage) => (
                    <option value={stage.id} key={stage.id}>
                      {stageLabel(stage.id)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{tx("قيمة الصفقة", "Amount")}</span>
                <input
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{tx("نسبة الاحتمال", "Probability")}</span>
                <input
                  value={form.probability}
                  onChange={(event) => updateField("probability", event.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{tx("تاريخ الإغلاق المتوقع", "Expected close date")}</span>
                <input
                  value={form.expected_close_date}
                  onChange={(event) => updateField("expected_close_date", event.target.value)}
                  type="date"
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
                onClick={saveDeal}
                disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                type="button"
              >
                {saving
                  ? tx("جاري الحفظ...", "Saving...")
                  : editingId
                    ? tx("حفظ التعديل", "Save changes")
                    : tx("إضافة الصفقة", "Add deal")}
              </button>

              {editingId ? (
                <button
                  onClick={resetForm}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
                  type="button"
                >
                  {tx("إلغاء", "Cancel")}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="safe-card min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{tx("مسار المبيعات", "Sales pipeline")}</p>
              <h2 className="mt-1 text-3xl font-black">{tx("الصفقات", "Deals")}</h2>
            </div>

            <div className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm md:max-w-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tx("ابحث في الصفقات...", "Search deals...")}
                className="w-full border-none bg-transparent p-0 text-white outline-none"
              />
            </div>
          </div>

          <div className="safe-scroll pb-3">
            <div className="grid min-w-[1180px] grid-cols-6 gap-4">
              {stages.map((stage) => {
                const stageDeals = filteredDeals.filter(
                  (deal) => deal.stage === stage.id
                );

                const stageTotal = stageDeals.reduce(
                  (sum, deal) => sum + Number(deal.amount ?? 0),
                  0
                );

                return (
                  <div
                    key={stage.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setActiveStage(stage.id);
                    }}
                    onDragLeave={() => setActiveStage(null)}
                    onDrop={(event) => {
                      event.preventDefault();
                      const dealId =
                        event.dataTransfer.getData("text/plain") || draggedDealId;

                      setActiveStage(null);
                      setDraggedDealId(null);

                      if (dealId) {
                        moveDeal(dealId, stage.id);
                      }
                    }}
                    className={`min-h-[560px] rounded-[1.7rem] border p-3 transition ${
                      activeStage === stage.id
                        ? "border-emerald-400/60 bg-emerald-400/10"
                        : "border-white/10 bg-slate-950/30"
                    }`}
                  >
                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs ${stage.color}`}>
                          {stageLabel(stage.id)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {stageDeals.length}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-bold text-white">
                        {formatMoney(stageTotal)}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {stageDeals.map((deal) => (
                        <article
                          key={deal.id}
                          draggable
                          onDragStart={(event) => {
                            setDraggedDealId(deal.id);
                            event.dataTransfer.setData("text/plain", deal.id);
                          }}
                          onDragEnd={() => {
                            setDraggedDealId(null);
                            setActiveStage(null);
                          }}
                          className="elite-motion-card cursor-grab rounded-3xl border border-white/10 bg-slate-900/80 p-4 active:cursor-grabbing"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-sm font-bold text-white">
                                {deal.title}
                              </h3>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {deal.companies?.name ?? tx("بدون شركة", "No company")}
                              </p>
                            </div>

                            <GripVertical className="h-4 w-4 shrink-0 text-slate-500" />
                          </div>

                          <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                <CircleDollarSign className="h-3.5 w-3.5 text-emerald-300" />
                                {tx("القيمة", "Amount")}
                              </span>
                              <strong className="text-white">{formatMoney(deal.amount)}</strong>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3.5 w-3.5 text-sky-300" />
                                {tx("الاحتمال", "Probability")}
                              </span>
                              <strong className="text-white">{deal.probability ?? 0}%</strong>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5 text-violet-300" />
                                {tx("الإغلاق", "Close")}
                              </span>
                              <strong className="text-white">{formatDate(deal.expected_close_date)}</strong>
                            </div>
                          </div>

                          {deal.contacts?.full_name ? (
                            <p className="mt-3 truncate rounded-2xl bg-white/10 px-3 py-2 text-xs text-slate-300">
                              {deal.contacts.full_name}
                            </p>
                          ) : null}

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => startEdit(deal)}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                              type="button"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {tx("تعديل", "Edit")}
                            </button>

                            <button
                              onClick={() => deleteDeal(deal.id)}
                              className="flex items-center justify-center rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </article>
                      ))}

                      {stageDeals.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                          {tx("اسحب صفقة هنا", "Drop deals here")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}



