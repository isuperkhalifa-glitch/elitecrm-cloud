"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PencilLine, Settings2, X } from "lucide-react";

type Props = {
  role: string | null;
};

export function AdminEditButton({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);

  const canEdit = role === "admin";

  useEffect(() => {
    if (!canEdit) return;

    setEnabled(localStorage.getItem("elitecrm-admin-edit-mode") === "true");
  }, [canEdit]);

  if (!canEdit) return null;

  function toggleEditMode() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("elitecrm-admin-edit-mode", String(next));
    window.dispatchEvent(new CustomEvent("elitecrm-admin-edit-mode", { detail: next }));
  }

  const pageKey = pathname === "/" ? "dashboard" : pathname.replace(/^\//, "") || "dashboard";

  return (
    <>
      {enabled ? (
        <div className="fixed inset-x-4 top-20 z-[70] mx-auto max-w-xl rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-bold text-emerald-200 shadow-2xl backdrop-blur">
          وضع تعديل الأدمن مفعّل — أي تعديل هنا للأدمن فقط
        </div>
      ) : null}

      <div className="fixed bottom-5 end-5 z-[80] flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleEditMode}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl transition hover:bg-slate-900"
        >
          {enabled ? <X className="h-4 w-4 text-red-300" /> : <PencilLine className="h-4 w-4 text-emerald-300" />}
          {enabled ? "إيقاف التعديل" : "تعديل الصفحة"}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/settings?page=${encodeURIComponent(pageKey)}`)}
          className="flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 shadow-2xl transition hover:bg-emerald-300"
        >
          <Settings2 className="h-4 w-4" />
          إعدادات الصفحة
        </button>
      </div>
    </>
  );
}
