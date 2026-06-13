"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { useScope } from "@/components/scope-provider";

type Company = {
  id: string;
  name: string;
};

type Deal = {
  id: string;
  title: string;
  amount: number | null;
  stage: string | null;
  company_id: string | null;
  companies?: Company | null;
};

type Invoice = {
  id: string;
  company_id: string | null;
  deal_id: string | null;
  invoice_number: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  due_date: string | null;
  notes: string | null;
  currency: string;
  owner_id: string | null;
  companies?: Company | null;
  deals?: Deal | null;
};

type InvoicesClientProps = {
  initialInvoices: Invoice[];
  companies: Company[];
  deals: Deal[];
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type InvoiceForm = {
  invoice_number: string;
  company_id: string;
  deal_id: string;
  amount: string;
  status: string;
  due_date: string;
  paid_at: string;
  notes: string;
};

const emptyForm: InvoiceForm = {
  invoice_number: "",
  company_id: "",
  deal_id: "",
  amount: "",
  status: "unpaid",
  due_date: "",
  paid_at: "",
  notes: "",
};

const statuses = ["unpaid", "partial", "paid", "overdue", "canceled"];

function makeInvoiceNumber() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  return `INV-${stamp}`;
}

export function InvoicesClient({
  initialInvoices,
  companies,
  deals,
  currentUserId,
  userEmail,
  fullName,
  role,
}: InvoicesClientProps) {
  const { language } = useI18n();
  const { scope } = useScope();
  const isArabic = language === "ar";

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [form, setForm] = useState<InvoiceForm>({
    ...emptyForm,
    invoice_number: makeInvoiceNumber(),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function tx(ar: string, en: string) {
    return isArabic ? ar : en;
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      unpaid: tx("غير مدفوعة", "Unpaid"),
      partial: tx("مدفوعة جزئيًا", "Partially Paid"),
      paid: tx("مدفوعة", "Paid"),
      overdue: tx("متأخرة", "Overdue"),
      canceled: tx("ملغاة", "Canceled"),
    };

    return labels[status] ?? status;
  }

  function statusClass(status: string) {
    if (status === "paid") return "bg-emerald-400/15 text-emerald-300";
    if (status === "partial") return "bg-sky-400/15 text-sky-300";
    if (status === "overdue") return "bg-red-500/15 text-red-300";
    if (status === "canceled") return "bg-slate-500/15 text-slate-400";
    return "bg-yellow-400/15 text-yellow-300";
  }

  function formatMoney(value: number | string | null) {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
      style: "currency",
      currency: "SAR",
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

  function isOverdue(invoice: Invoice) {
    if (!invoice.due_date) return false;
    if (invoice.status === "paid" || invoice.status === "canceled") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(invoice.due_date);
    due.setHours(0, 0, 0, 0);

    return due < today;
  }

  const scopedInvoices = useMemo(() => {
    if (scope.mode === "user" && scope.targetId) {
      return invoices.filter((invoice) => invoice.owner_id === scope.targetId);
    }

    if (scope.mode === "company" && scope.targetId) {
      return invoices.filter((invoice) => invoice.company_id === scope.targetId);
    }

    return invoices;
  }, [invoices, scope]);

  const filteredInvoices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return scopedInvoices.filter((invoice) => {
      const statusMatch =
        statusFilter === "all" || invoice.status === statusFilter;

      const keywordMatch =
        !keyword ||
        [
          invoice.invoice_number,
          invoice.companies?.name,
          invoice.deals?.title,
          invoice.status,
          invoice.amount,
          invoice.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return statusMatch && keywordMatch;
    });
  }, [scopedInvoices, search, statusFilter]);

  const stats = useMemo(() => {
    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount ?? 0),
      0
    );

    const paidAmount = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);

    const unpaidAmount = invoices
      .filter(
        (invoice) => invoice.status !== "paid" && invoice.status !== "canceled"
      )
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);

    const overdueAmount = invoices
      .filter((invoice) => invoice.status === "overdue" || isOverdue(invoice))
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);

    return {
      count: invoices.length,
      totalAmount,
      paidAmount,
      unpaidAmount,
      overdueAmount,
    };
  }, [invoices]);

  function updateField(field: keyof InvoiceForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectDeal(dealId: string) {
    const selectedDeal = deals.find((deal) => deal.id === dealId);

    setForm((current) => ({
      ...current,
      deal_id: dealId,
      company_id: selectedDeal?.company_id ?? current.company_id,
      amount:
        selectedDeal?.amount !== null && selectedDeal?.amount !== undefined
          ? String(selectedDeal.amount)
          : current.amount,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      invoice_number: makeInvoiceNumber(),
    });
    setError("");
  }

  function startEdit(invoice: Invoice) {
    setEditingId(invoice.id);
    setMessage("");
    setError("");

    setForm({
      invoice_number: invoice.invoice_number ?? "",
      company_id: invoice.company_id ?? "",
      deal_id: invoice.deal_id ?? "",
      amount: String(invoice.amount ?? ""),
      status: invoice.status ?? "unpaid",
      due_date: invoice.due_date ? invoice.due_date.slice(0, 10) : "",
      paid_at: invoice.paid_at ? invoice.paid_at.slice(0, 10) : "",
      notes: invoice.notes ?? "",
    });
  }

  async function saveInvoice() {
    setMessage("");
    setError("");

    if (!form.invoice_number.trim()) {
      setError(tx("رقم الفاتورة مطلوب.", "Invoice number is required."));
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError(tx("مبلغ الفاتورة مطلوب.", "Invoice amount is required."));
      return;
    }

    if (!form.company_id && !form.deal_id) {
      setError(
        tx(
          "اختر شركة أو صفقة قبل إنشاء الفاتورة.",
          "Choose a company or deal before creating the invoice."
        )
      );
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const paidAt =
      form.status === "paid"
        ? form.paid_at
          ? new Date(form.paid_at).toISOString()
          : new Date().toISOString()
        : form.paid_at
          ? new Date(form.paid_at).toISOString()
          : null;

    const payload = {
      invoice_number: form.invoice_number.trim(),
      company_id: form.company_id || null,
      deal_id: form.deal_id || null,
      amount: Number(form.amount),
      status: form.status,
      due_date: form.due_date || null,
      paid_at: paidAt,
      notes: form.notes.trim() || null,
      currency: "SAR",
      owner_id: scope.mode === "user" && scope.targetId ? scope.targetId : currentUserId,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", editingId)
        .select("id,company_id,deal_id,invoice_number,amount,status,paid_at,created_at,due_date,notes,currency,owner_id,companies(id,name),deals(id,title,amount,stage,owner_id)")
        .single();

      setSaving(false);

      if (error || !data) {
        console.error(error);
        setError(error?.message ?? tx("تعذر حفظ الفاتورة.", "Unable to save invoice."));
        return;
      }

      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id === data.id ? (data as unknown as Invoice) : invoice
        )
      );

      setMessage(tx("تم تعديل الفاتورة بنجاح.", "Invoice updated successfully."));
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .insert(payload)
      .select("id,company_id,deal_id,invoice_number,amount,status,paid_at,created_at,due_date,notes,currency,owner_id,companies(id,name),deals(id,title,amount,stage,owner_id)")
      .single();

    setSaving(false);

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? tx("تعذر حفظ الفاتورة.", "Unable to save invoice."));
      return;
    }

    setInvoices((current) => [data as unknown as Invoice, ...current]);
    setMessage(tx("تم إنشاء الفاتورة بنجاح.", "Invoice created successfully."));
    resetForm();
  }

  async function deleteInvoice(invoiceId: string) {
    const confirmed = window.confirm(
      tx("هل تريد حذف هذه الفاتورة نهائيًا؟", "Delete this invoice permanently?")
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setInvoices((current) =>
      current.filter((invoice) => invoice.id !== invoiceId)
    );
    setMessage(tx("تم حذف الفاتورة.", "Invoice deleted."));
  }

  async function markAsPaid(invoice: Invoice) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", invoice.id)
      .select("id,company_id,deal_id,invoice_number,amount,status,paid_at,created_at,due_date,notes,currency,owner_id,companies(id,name),deals(id,title,amount,stage,owner_id)")
      .single();

    if (error || !data) {
      console.error(error);
      setError(error?.message ?? tx("تعذر تحديث الفاتورة.", "Unable to update invoice."));
      return;
    }

    setInvoices((current) =>
      current.map((item) => (item.id === data.id ? (data as unknown as Invoice) : item))
    );

    setMessage(tx("تم تسجيل الفاتورة كمدفوعة.", "Invoice marked as paid."));
  }

  return (
    <AppShell
      titleKey="invoices"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">{tx("عدد الفواتير", "Invoices")}</p>
            <Receipt className="h-5 w-5 text-emerald-300" />
          </div>
          <h2 className="mt-2 text-3xl font-black">{stats.count}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">{tx("إجمالي الفواتير", "Total value")}</p>
            <FileText className="h-5 w-5 text-sky-300" />
          </div>
          <h2 className="mt-2 text-2xl font-black">{formatMoney(stats.totalAmount)}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-emerald-300">{tx("المدفوع", "Paid")}</p>
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </div>
          <h2 className="mt-2 text-2xl font-black text-emerald-300">{formatMoney(stats.paidAmount)}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-200">{tx("المتأخر", "Overdue")}</p>
            <Clock className="h-5 w-5 text-red-300" />
          </div>
          <h2 className="mt-2 text-2xl font-black text-red-200">{formatMoney(stats.overdueAmount)}</h2>
        </div>
      </div>

      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-300">
                {editingId ? tx("تعديل فاتورة", "Edit invoice") : tx("إنشاء فاتورة", "Create invoice")}
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {editingId ? tx("بيانات الفاتورة", "Invoice details") : tx("فاتورة جديدة", "New invoice")}
              </h2>
            </div>

            <Plus className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">{tx("رقم الفاتورة", "Invoice number")}</span>
              <input
                value={form.invoice_number}
                onChange={(event) => updateField("invoice_number", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                dir="ltr"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">{tx("الصفقة", "Deal")}</span>
              <select
                value={form.deal_id}
                onChange={(event) => selectDeal(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="">{tx("بدون صفقة", "No deal")}</option>
                {deals.map((deal) => (
                  <option value={deal.id} key={deal.id}>
                    {deal.title}
                  </option>
                ))}
              </select>
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{tx("المبلغ", "Amount")}</span>
                <input
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{tx("الحالة", "Status")}</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {statuses.map((status) => (
                    <option value={status} key={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className="text-sm text-slate-300">{tx("تاريخ الاستحقاق", "Due date")}</span>
                <input
                  value={form.due_date}
                  onChange={(event) => updateField("due_date", event.target.value)}
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">{tx("تاريخ الدفع", "Paid date")}</span>
                <input
                  value={form.paid_at}
                  onChange={(event) => updateField("paid_at", event.target.value)}
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  dir="ltr"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm text-slate-300">{tx("ملاحظات", "Notes")}</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              />
            </label>

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {message}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={saveInvoice}
                disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                type="button"
              >
                {saving
                  ? tx("جاري الحفظ...", "Saving...")
                  : editingId
                    ? tx("حفظ التعديل", "Save changes")
                    : tx("إنشاء الفاتورة", "Create invoice")}
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
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-emerald-300">{tx("إدارة الفواتير", "Invoice management")}</p>
              <h2 className="mt-1 text-3xl font-black">{tx("الفواتير", "Invoices")}</h2>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm md:min-w-72">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={tx("ابحث في الفواتير...", "Search invoices...")}
                  className="w-full border-none bg-transparent p-0 text-white outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
              >
                <option value="all">{tx("كل الحالات", "All statuses")}</option>
                {statuses.map((status) => (
                  <option value={status} key={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredInvoices.map((invoice) => {
              const overdue = isOverdue(invoice);
              const visualStatus = overdue && invoice.status !== "paid" ? "overdue" : invoice.status;

              return (
                <article
                  key={invoice.id}
                  className={`elite-motion-card rounded-3xl border p-5 ${
                    visualStatus === "overdue"
                      ? "border-red-500/25 bg-red-500/10"
                      : "border-white/10 bg-slate-900/70"
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black" dir="ltr">
                          {invoice.invoice_number}
                        </h3>

                        <span className={`rounded-full px-3 py-1 text-xs ${statusClass(visualStatus)}`}>
                          {statusLabel(visualStatus)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-2 xl:grid-cols-4">
                        <p>
                          <span className="text-slate-500">{tx("الشركة", "Company")}: </span>
                          {invoice.companies?.name ?? "-"}
                        </p>

                        <p>
                          <span className="text-slate-500">{tx("الصفقة", "Deal")}: </span>
                          {invoice.deals?.title ?? "-"}
                        </p>

                        <p>
                          <span className="text-slate-500">{tx("الاستحقاق", "Due")}: </span>
                          {formatDate(invoice.due_date)}
                        </p>

                        <p>
                          <span className="text-slate-500">{tx("الدفع", "Paid")}: </span>
                          {formatDate(invoice.paid_at)}
                        </p>
                      </div>

                      {invoice.notes ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                          {invoice.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3 xl:items-end">
                      <p className="flex items-center gap-2 text-2xl font-black text-white">
                        <Banknote className="h-5 w-5 text-emerald-300" />
                        {formatMoney(invoice.amount)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {invoice.status !== "paid" && invoice.status !== "canceled" ? (
                          <button
                            onClick={() => markAsPaid(invoice)}
                            className="flex items-center gap-1 rounded-xl border border-emerald-400/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-400/10"
                            type="button"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {tx("تسجيل كمدفوعة", "Mark paid")}
                          </button>
                        ) : null}

                        <button
                          onClick={() => startEdit(invoice)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                          type="button"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {tx("تعديل", "Edit")}
                        </button>

                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="flex items-center gap-1 rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {tx("حذف", "Delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredInvoices.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
                {tx("لا توجد فواتير حتى الآن.", "No invoices yet.")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}



