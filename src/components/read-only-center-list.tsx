"use client";

import { useI18n } from "@/components/language-provider";

type Item = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  status?: string | null;
};

export function ReadOnlyCenterList({ items }: { items: Item[] }) {
  const { language } = useI18n();
  const isArabic = language === "ar";

  return (
    <div className="space-y-4">
      <section className="v8-card rounded-md p-5">
        <h2 className="v8-heading text-xl font-bold">
          {isArabic ? "مراكز التدريب" : "Training centers"}
        </h2>
        <p className="v8-muted mt-1 text-sm">
          {isArabic ? "عرض البيانات فقط حسب صلاحيتك الحالية." : "Read-only access for your current role."}
        </p>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="v8-card rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="v8-heading font-bold">{item.name}</h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                {item.status === "archived" ? (isArabic ? "مؤرشف" : "Archived") : (isArabic ? "نشط" : "Active")}
              </span>
            </div>
            <p className="v8-muted mt-3 text-sm">{item.city || "-"}</p>
            <p className="v8-muted mt-1 text-sm" dir="ltr">{item.phone || "-"}</p>
            <p className="v8-muted mt-1 truncate text-sm" dir="ltr">{item.email || "-"}</p>
          </article>
        ))}
      </section>
      {!items.length ? (
        <div className="v8-card rounded-md p-8 text-center text-slate-500">
          {isArabic ? "لا توجد بيانات." : "No data found."}
        </div>
      ) : null}
    </div>
  );
}
