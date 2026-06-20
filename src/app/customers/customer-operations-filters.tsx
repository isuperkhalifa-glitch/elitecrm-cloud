"use client";

import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  followupOptions,
  leadTypeOptions,
  stageOptions,
  statusOptions,
  type CustomerCourse,
  type CustomerFilters,
  type CustomerProfile,
} from "./customer-operations-types";

type Props = {
  filters: CustomerFilters;
  profiles: CustomerProfile[];
  courses: CustomerCourse[];
  sources: string[];
  cities: string[];
  educationLevels: string[];
  enhancedSchemaReady: boolean;
  role: string | null;
  pageSize: number;
  isArabic: boolean;
  tx: (ar: string, en: string) => string;
  title: string;
  description: string;
  lockedFields: Array<keyof CustomerFilters>;
  onSetFilter: (field: keyof CustomerFilters, value: string, applyNow?: boolean) => void;
  onQuickFollowup: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onPageSize: (size: number) => void;
  statusLabel: (value?: string | null) => string;
  connectionLabel: (value?: string | null) => string;
};

export function CustomerOperationsFilters({
  filters,
  profiles,
  courses,
  sources,
  cities,
  educationLevels,
  enhancedSchemaReady,
  role,
  pageSize,
  isArabic,
  tx,
  title,
  description,
  lockedFields,
  onSetFilter,
  onQuickFollowup,
  onApply,
  onReset,
  onPageSize,
  statusLabel,
  connectionLabel,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const locked = useMemo(() => new Set<keyof CustomerFilters>(lockedFields), [lockedFields]);

  return (
    <section className="v8-card rounded-md p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--v8-border)" }}>
        <div>
          <h2 className="v8-heading text-xl font-semibold">{title}</h2>
          <p className="v8-muted mt-1 text-sm">{description}</p>
        </div>
        <button type="button" onClick={onReset} className="v8-button rounded px-3 py-2 text-sm">
          {tx("إعادة ضبط الصفحة", "Reset page")}
        </button>
      </div>

      {!locked.has("followup") ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {followupOptions.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onQuickFollowup(option.value)}
              className={`rounded border px-3 py-2 text-xs font-semibold transition ${
                filters.followup === option.value
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {isArabic ? option.ar : option.en}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          {tx("هذه الصفحة مخصصة للمتابعات المتأخرة", "This page is dedicated to overdue follow-ups")}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Field label={tx("بحث", "Search")} wide>
          <div className="relative">
            <Search className="v8-muted absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={filters.q}
              onChange={(event) => onSetFilter("q", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onApply();
              }}
              placeholder={tx("الاسم، الرقم، البريد أو الدورة", "Name, phone, email, or course")}
              className="v8-input w-full rounded border py-2.5 pe-3 ps-9 text-sm"
            />
          </div>
        </Field>

        <Field label={tx("الحالة", "Status")}>
          <select
            value={filters.status}
            onChange={(event) => onSetFilter("status", event.target.value, true)}
            className="v8-input w-full rounded border px-3 py-2.5 text-sm"
          >
            <option value="">{tx("كل الحالات", "All statuses")}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </select>
        </Field>

        {!locked.has("connection") ? (
          <Field label={tx("نوع الاتصال", "Connection type")}>
            <select
              value={filters.connection}
              onChange={(event) => onSetFilter("connection", event.target.value, true)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
            >
              <option value="">{tx("كل الاتصالات", "All connections")}</option>
              {["distributed", "ivr", "manual", "redirected"].map((value) => (
                <option key={value} value={value}>{connectionLabel(value)}</option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label={tx("المصدر", "Source")}>
          <select
            value={filters.source}
            onChange={(event) => onSetFilter("source", event.target.value, true)}
            className="v8-input w-full rounded border px-3 py-2.5 text-sm"
          >
            <option value="">{tx("كل المصادر", "All sources")}</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </Field>

        <Field label={tx("المسؤول", "Owner")}>
          <select
            value={filters.owner}
            onChange={(event) => onSetFilter("owner", event.target.value, true)}
            disabled={role === "sales"}
            className="v8-input w-full rounded border px-3 py-2.5 text-sm disabled:opacity-50"
          >
            <option value="">{tx("كل المستخدمين", "All users")}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>
            ))}
          </select>
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((value) => !value)}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
      >
        {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {advancedOpen
          ? tx("إخفاء الفلاتر المتقدمة", "Hide advanced filters")
          : tx("إظهار الفلاتر المتقدمة", "Show advanced filters")}
      </button>

      {advancedOpen ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {!locked.has("stage") ? (
            <Field label={tx("مرحلة البيع", "Sales stage")}>
              <select
                value={filters.stage}
                onChange={(event) => onSetFilter("stage", event.target.value, true)}
                className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              >
                {stageOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{isArabic ? option.ar : option.en}</option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label={tx("نوع العميل", "Lead type")}>
            <select
              value={filters.leadType}
              onChange={(event) => onSetFilter("leadType", event.target.value, true)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
            >
              <option value="">{tx("كل الأنواع", "All types")}</option>
              {leadTypeOptions.map((type) => <option key={type} value={type}>{statusLabel(type)}</option>)}
            </select>
          </Field>

          <Field label={tx("الدورة", "Course")}>
            <select
              value={filters.course}
              onChange={(event) => onSetFilter("course", event.target.value, true)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
            >
              <option value="">{tx("كل الدورات", "All courses")}</option>
              {courses.map((course) => <option key={course.id} value={course.name}>{course.name}</option>)}
            </select>
          </Field>

          {enhancedSchemaReady ? (
            <Field label={tx("المدينة", "City")}>
              <select
                value={filters.city}
                onChange={(event) => onSetFilter("city", event.target.value, true)}
                className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              >
                <option value="">{tx("كل المدن", "All cities")}</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </Field>
          ) : null}

          {enhancedSchemaReady ? (
            <Field label={tx("المؤهل التعليمي", "Education level")}>
              <select
                value={filters.education}
                onChange={(event) => onSetFilter("education", event.target.value, true)}
                className="v8-input w-full rounded border px-3 py-2.5 text-sm"
              >
                <option value="">{tx("كل المؤهلات", "All education levels")}</option>
                {educationLevels.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
          ) : null}

          <Field label={tx("تاريخ الإنشاء من", "Created from")}>
            <input
              type="date"
              value={filters.createdFrom}
              onChange={(event) => onSetFilter("createdFrom", event.target.value)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
            />
          </Field>
          <Field label={tx("تاريخ الإنشاء إلى", "Created to")}>
            <input
              type="date"
              value={filters.createdTo}
              onChange={(event) => onSetFilter("createdTo", event.target.value)}
              className="v8-input w-full rounded border px-3 py-2.5 text-sm"
            />
          </Field>

          {filters.followup === "custom" && !locked.has("followup") ? (
            <>
              <Field label={tx("المتابعة من", "Follow-up from")}>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => onSetFilter("startDate", event.target.value)}
                  className="v8-input w-full rounded border px-3 py-2.5 text-sm"
                />
              </Field>
              <Field label={tx("المتابعة إلى", "Follow-up to")}>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => onSetFilter("endDate", event.target.value)}
                  className="v8-input w-full rounded border px-3 py-2.5 text-sm"
                />
              </Field>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {tx("تطبيق البحث", "Apply search")}
        </button>
        <select
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value))}
          className="v8-input rounded border px-3 py-2 text-sm"
        >
          {[25, 50, 100].map((size) => (
            <option key={size} value={size}>{tx(`عرض ${size}`, `Show ${size}`)}</option>
          ))}
        </select>
      </div>
    </section>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "xl:col-span-2" : ""}>
      <span className="v8-heading mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
