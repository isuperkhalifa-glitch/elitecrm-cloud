"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { guessCourseId, normalizeLeadStatus, splitPhone } from "@/lib/crm/customer-core";

type ImportsClientProps = {
  currentUserId: string;
  userEmail: string | null;
  fullName: string | null;
  role: string | null;
};

type RawImportRow = Record<string, unknown>;

const allowedImportRoles = new Set(["developer", "admin", "moderator", "marketer"]);

const templateColumns = [
  { key: "studentName", label: "ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„", required: true, example: "ظ…ط­ظ…ط¯ ط£ط­ظ…ط¯" },
  { key: "studentMobileNumber", label: "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„", required: true, example: "0551234567" },
  { key: "email", label: "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ", required: false, example: "client@example.com" },
  { key: "trainingCenter", label: "ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨", required: false, example: "ظ…ط±ظƒط² ط±ظٹظپ ط§ظ„ظ…ظ‡ط§ط±ط§طھ" },
  { key: "program", label: "ط§ظ„ط¯ظˆط±ط© / ط§ظ„ط¨ط±ظ†ط§ظ…ط¬", required: false, example: "PMP" },
  { key: "source", label: "ط§ظ„ظ…طµط¯ط±", required: false, example: "Meta Ads" },
  { key: "campaign", label: "ط§ظ„ط­ظ…ظ„ط©", required: false, example: "PMP June" },
  { key: "status", label: "ط­ط§ظ„ط© ط§ظ„ط¹ظ…ظٹظ„", required: false, example: "interested" },
  { key: "leadType", label: "ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„", required: false, example: "fresh" },
  { key: "notes", label: "ظ…ظ„ط§ط­ط¸ط§طھ", required: false, example: "ط·ظ„ط¨ ط§ظ„طھظˆط§طµظ„ ظ…ط³ط§ط،ظ‹" },
];

type PreparedLead = {
  external_id: string | null;
  full_name: string;
  phone: string | null;
  country_code: string | null;
  phone_number: string | null;
  email: string | null;
  company_name: string | null;
  source: string | null;
  status: string;
  priority: string;
  owner_id: string | null;
  program: string | null;
  course_id: string | null;
  lead_type: string;
  customer_status: string;
  registration_status: string;
  payment_status: string;
  notes: string | null;
  system_source: string | null;
  agent_id: number | null;
  potential: number | null;
  tasks_count: number | null;
  external_created_at: string | null;
  external_updated_at: string | null;
  import_batch_id?: string | null;
};

function readText(row: RawImportRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function readNumber(row: RawImportRow, keys: string[]) {
  const value = readText(row, keys);

  if (!value) return null;

  const number = Number(String(value).replace(/[^\d.-]/g, ""));

  return Number.isFinite(number) ? number : null;
}

function normalizePhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "").replace(/^\+/, "");

  if (!cleaned) return "";

  if (cleaned.startsWith("966")) return cleaned;

  if (cleaned.startsWith("05") && cleaned.length === 10) {
    return `966${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("5") && cleaned.length === 9) {
    return `966${cleaned}`;
  }

  return cleaned;
}

function cleanNotes(value: string) {
  return value
    .replaceAll("&#13;&#10;", "\n")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function parseDate(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function mapStatus(value: string) {
  return normalizeLeadStatus(value);
}

function buildLeadPayload(
  rows: RawImportRow[],
  currentUserId: string,
  importBatchId?: string
) {
  const seen = new Set<string>();
  const prepared: PreparedLead[] = [];
  let skippedRows = 0;

  for (const row of rows) {
    const externalId = readText(row, ["id"]);
    const name = readText(row, ["studentName", "name", "full_name", "ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„", "ط§ظ„ط§ط³ظ…"]);
    const rawPhone = readText(row, [
      "studentMobileNumber",
      "allNumbers",
      "phone",
      "mobile",
      "ط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„",
      "ط§ظ„ط¬ظˆط§ظ„",
      "ط§ظ„ظ…ظˆط¨ط§ظٹظ„",
    ]);
    const phone = normalizePhone(rawPhone);
    const phoneParts = splitPhone(phone);
    const program = readText(row, ["program", "course", "ط§ظ„ط¯ظˆط±ط©", "ط§ظ„ط¨ط±ظ†ط§ظ…ط¬"]);
    const courseId = guessCourseId(program);
    const notes = cleanNotes(
      [
        readText(row, ["notes", "ظ…ظ„ط§ط­ط¸ط§طھ"]),
        readText(row, ["otherDetails"]),
      ]
        .filter(Boolean)
        .join("\n\n")
    );

    if (!name || !phone) {
      skippedRows += 1;
      continue;
    }

    const uniqueKey = externalId || phone;

    if (seen.has(uniqueKey)) {
      skippedRows += 1;
      continue;
    }

    seen.add(uniqueKey);

    prepared.push({
      external_id: externalId || (phone ? `phone:${phone}` : null),
      full_name: name,
      phone,
      country_code: phoneParts.country_code,
      phone_number: phoneParts.phone_number || null,
      email: readText(row, ["email", "ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ", "ط§ظ„ط¨ط±ظٹط¯"]) || null,
      company_name: readText(row, ["trainingCenter", "company", "company_name", "ظ…ط±ظƒط² ط§ظ„طھط¯ط±ظٹط¨", "ط§ظ„ط´ط±ظƒط©"]) || program || null,
      source: readText(row, ["source", "campaign", "ط§ظ„ظ…طµط¯ط±", "ط§ظ„ط­ظ…ظ„ط©"]) || "excel_import",
      status: mapStatus(readText(row, ["status"])),
      priority: readNumber(row, ["potential"]) ? "high" : "medium",
      owner_id: null,
      program: program || null,
      course_id: courseId,
      lead_type: readText(row, ["leadType", "lead_type", "ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„"]) || "fresh",
      customer_status: mapStatus(readText(row, ["status"])),
      registration_status: "not_registered",
      payment_status: mapStatus(readText(row, ["status"])) === "paid" ? "paid" : "unpaid",
      notes: notes || null,
      system_source: readText(row, ["systemSource"]) || null,
      agent_id: readNumber(row, ["agentId"]),
      potential: readNumber(row, ["potential"]),
      tasks_count: readNumber(row, ["tasks_count"]),
      external_created_at: parseDate(readText(row, ["created_at"])),
      external_updated_at: parseDate(readText(row, ["updated_at"])),
      import_batch_id: importBatchId ?? null,
    });
  }

  return {
    prepared,
    skippedRows,
  };
}

export function ImportsClient({
  currentUserId,
  userEmail,
  fullName,
  role,
}: ImportsClientProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<RawImportRow[]>([]);
  const [loadingFile, setLoadingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canImport = allowedImportRoles.has(role ?? "");
  const preview = rows.slice(0, 8);

  const stats = useMemo(() => {
    const result = buildLeadPayload(rows, currentUserId);

    return {
      total: rows.length,
      valid: result.prepared.length,
      skipped: result.skippedRows,
    };
  }, [rows, currentUserId]);

  function downloadTemplate() {
    const sample = [Object.fromEntries(templateColumns.map((column) => [column.key, column.example]))];
    const worksheet = XLSX.utils.json_to_sheet(sample, { header: templateColumns.map((column) => column.key) });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "leads-template");
    XLSX.writeFile(workbook, "elitecrm-leads-template.xlsx");
  }

  async function handleFile(file: File | null) {
    setMessage("");
    setError("");
    setRows([]);

    if (!file) return;

    setLoadingFile(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: false,
      });

      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      const json = XLSX.utils.sheet_to_json<RawImportRow>(sheet, {
        defval: "",
        raw: false,
      });

      setRows(json);
      setMessage(`تم قراءة الملف بنجاح. عدد الصفوف: ${json.length}`);
    } catch (fileError) {
      console.error(fileError);
      setError("تعذر قراءة ملف Excel. تأكد أن الملف بصيغة xlsx.");
    } finally {
      setLoadingFile(false);
    }
  }

  async function runImport() {
    setMessage("");
    setError("");

    if (!canImport) {
      setError("ظ‡ط°ظ‡ ط§ظ„طµظ„ط§ط­ظٹط© ظ…طھط§ط­ط© ظ„ظ„ظ…ط·ظˆط± ظˆط§ظ„ظ…ط¯ظٹط± ط§ظ„ط¹ط§ظ… ظˆط§ظ„ظ…ظˆط¯ظٹط±ظٹطھظˆط± ظˆط§ظ„ظ…ط³ظˆظ‚ ظپظ‚ط·.");
      return;
    }

    const supabase = createClient();

    const basePayload = buildLeadPayload(rows, currentUserId);

    if (basePayload.prepared.length === 0) {
      setError("لا توجد صفوف صالحة للاستيراد.");
      return;
    }

    setImporting(true);

    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({
        file_name: fileName || "import.xlsx",
        entity_type: "leads",
        total_rows: rows.length,
        imported_rows: 0,
        failed_rows: basePayload.skippedRows,
        status: "processing",
        imported_by: currentUserId,
      })
      .select("id")
      .single();

    if (batchError || !batch) {
      console.error(batchError);
      setImporting(false);
      setError(batchError?.message ?? "تعذر إنشاء عملية الاستيراد.");
      return;
    }

    const payload = buildLeadPayload(rows, currentUserId, batch.id);
    const chunkSize = 200;
    let importedRows = 0;
    let failedRows = payload.skippedRows;

    for (let index = 0; index < payload.prepared.length; index += chunkSize) {
      const chunk = payload.prepared.slice(index, index + chunkSize);

      const { error: upsertError } = await supabase
        .from("leads")
        .upsert(chunk, {
          onConflict: "external_id",
        });

      if (upsertError) {
        console.error(upsertError);
        failedRows += chunk.length;
      } else {
        importedRows += chunk.length;
      }
    }

    await supabase
      .from("import_batches")
      .update({
        imported_rows: importedRows,
        failed_rows: failedRows,
        status: failedRows > 0 ? "completed_with_errors" : "completed",
      })
      .eq("id", batch.id);

    setImporting(false);

    if (importedRows === 0) {
      setError("لم يتم استيراد أي صف. راجع تنسيق الملف.");
      return;
    }

    setMessage(
      `تم الاستيراد بنجاح. تم إدخال/تحديث ${importedRows} صف، وتم تخطي ${failedRows} صف.`
    );
  }

  return (
    <AppShell
      titleKey="imports"
      userEmail={userEmail}
      fullName={fullName}
      role={role}
    >
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">إجمالي الصفوف</p>
          <h2 className="mt-2 text-3xl font-black">{stats.total}</h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-sm text-emerald-300">صفوف صالحة</p>
          <h2 className="mt-2 text-3xl font-black text-emerald-300">
            {stats.valid}
          </h2>
        </div>

        <div className="safe-card rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-sm text-red-200">صفوف متخطاة</p>
          <h2 className="mt-2 text-3xl font-black text-red-200">
            {stats.skipped}
          </h2>
        </div>
      </div>

      <section className="mb-6 safe-card rounded-[2rem] border border-sky-400/20 bg-sky-400/10 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-sky-200">ط´ظƒظ„ ط§ظ„ط´ظٹطھ ط§ظ„ظ…ظ‚ط¨ظˆظ„</p>
            <h2 className="mt-1 text-2xl font-black text-white">ط§ط³طھط®ط¯ظ… ط§ظ„ط£ط¹ظ…ط¯ط© ط§ظ„طھط§ظ„ظٹط© ط¹ظ†ط¯ ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ط§ط،</h2>
            <p className="mt-2 text-sm leading-7 text-sky-100/80">ط§ظ„ط£ط¹ظ…ط¯ط© ط§ظ„ظ…ط·ظ„ظˆط¨ط© ظپظ‚ط·: ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„ ظˆط±ظ‚ظ… ط§ظ„ط¬ظˆط§ظ„. ط¨ط§ظ‚ظٹ ط§ظ„ط£ط¹ظ…ط¯ط© ط§ط®طھظٹط§ط±ظٹط© ظ„طھط¬ظ‡ظٹط² ط±ط­ظ„ط© ط§ظ„ط¹ظ…ظٹظ„ ظ…ظ† ط§ظ„ظ…طµط¯ط± ط­طھظ‰ ط§ظ„طھط³ط¬ظٹظ„ ظˆط§ظ„ط¯ظپط¹.</p>
          </div>
          <button onClick={downloadTemplate} type="button" className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-sky-200">طھط­ظ…ظٹظ„ ظ†ظ…ظˆط°ط¬ Excel</button>
        </div>
        <div className="mt-5 safe-scroll">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-sky-100">
                <th className="px-3 py-3 text-start">ط§ط³ظ… ط§ظ„ط¹ظ…ظˆط¯ ظپظٹ Excel</th>
                <th className="px-3 py-3 text-start">ط§ظ„ظ…ط¹ظ†ظ‰</th>
                <th className="px-3 py-3 text-start">ط¥ط¬ط¨ط§ط±ظٹطں</th>
                <th className="px-3 py-3 text-start">ظ…ط«ط§ظ„</th>
              </tr>
            </thead>
            <tbody>
              {templateColumns.map((column) => (
                <tr key={column.key} className="border-b border-white/10">
                  <td className="px-3 py-3 font-mono text-white">{column.key}</td>
                  <td className="px-3 py-3 text-sky-50">{column.label}</td>
                  <td className="px-3 py-3">{column.required ? "ظ†ط¹ظ…" : "ط§ط®طھظٹط§ط±ظٹ"}</td>
                  <td className="px-3 py-3 text-slate-200">{column.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <section className="safe-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm text-emerald-300">استيراد البيانات</p>
              <h2 className="text-2xl font-black">رفع ملف Excel</h2>
            </div>
          </div>

          <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-slate-900/50 p-6 text-center transition hover:border-emerald-400/40 hover:bg-emerald-400/10">
            {loadingFile ? (
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-300" />
            ) : (
              <FileSpreadsheet className="mb-4 h-10 w-10 text-emerald-300" />
            )}

            <span className="text-lg font-bold">اختار ملف Excel</span>
            <span className="mt-2 text-sm text-slate-400">
              نفس تنسيق ملف الطلاب والعملاء المحتملين
            </span>

            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {fileName ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
              {fileName}
            </div>
          ) : null}

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

          <button
            onClick={runImport}
            disabled={!canImport || importing || stats.valid === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
          >
            {importing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الاستيراد...
              </>
            ) : (
              <>
                <UploadCloud className="h-5 w-5" />
                بدء الاستيراد
              </>
            )}
          </button>
        </section>

        <section className="safe-card min-w-0 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <div className="mb-5">
            <p className="text-sm text-emerald-300">معاينة الملف</p>
            <h2 className="mt-1 text-2xl font-black">أول 8 صفوف</h2>
          </div>

          {preview.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-slate-400">
              ارفع ملف Excel لعرض المعاينة هنا.
            </div>
          ) : (
            <div className="safe-scroll">
              <table className="min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="px-3 py-3 text-start">ID</th>
                    <th className="px-3 py-3 text-start">الاسم</th>
                    <th className="px-3 py-3 text-start">الجوال</th>
                    <th className="px-3 py-3 text-start">المصدر</th>
                    <th className="px-3 py-3 text-start">الحالة</th>
                    <th className="px-3 py-3 text-start">البرنامج</th>
                    <th className="px-3 py-3 text-start">المهام</th>
                  </tr>
                </thead>

                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="px-3 py-3">{readText(row, ["id"])}</td>
                      <td className="px-3 py-3">
                        {readText(row, ["studentName"])}
                      </td>
                      <td className="px-3 py-3" dir="ltr">
                        {normalizePhone(
                          readText(row, ["studentMobileNumber", "allNumbers"])
                        )}
                      </td>
                      <td className="px-3 py-3">{readText(row, ["source"])}</td>
                      <td className="px-3 py-3">
                        {mapStatus(readText(row, ["status"]))}
                      </td>
                      <td className="px-3 py-3">{readText(row, ["program"])}</td>
                      <td className="px-3 py-3">
                        {readText(row, ["tasks_count"])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-400">
            <p className="font-bold text-white">خريطة الاستيراد:</p>
            <p>studentName ← اسم العميل المحتمل</p>
            <p>studentMobileNumber / allNumbers ← رقم الجوال</p>
            <p>program ← البرنامج / الدورة</p>
            <p>source + systemSource ← مصدر العميل</p>
            <p>status ← حالة العميل</p>
            <p>notes + otherDetails ← الملاحظات</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}




