"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("EliteCRM page error", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-100 p-6" dir="rtl">
      <div className="mx-auto mt-24 max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-800">تعذر تحميل الصفحة</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          حدث خطأ أثناء تحميل البيانات. الصفحة لم تعد تظهر فارغة، ويمكنك إعادة المحاولة الآن.
        </p>
        {error.message ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500" dir="ltr">
            {error.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
