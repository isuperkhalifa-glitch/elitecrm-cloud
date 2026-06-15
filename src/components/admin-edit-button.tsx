"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  PanelTopOpen,
  Settings2,
  SlidersHorizontal,
  X,
} from "lucide-react";

type Props = {
  role: string | null;
};

const labels = {
  tools: "\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u062a\u062e\u0635\u064a\u0635",
  toolsHint: "\u062a\u062d\u0643\u0645 \u0633\u0631\u064a\u0639 \u0641\u064a \u0627\u0644\u0635\u0641\u062d\u0629 \u0648\u0625\u0639\u062f\u0627\u062f\u0627\u062a\u0647\u0627",
  editMode: "\u0648\u0636\u0639 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0635\u0641\u062d\u0629",
  editModeDesc: "\u064a\u0641\u0639\u0651\u0644 \u0623\u062f\u0648\u0627\u062a \u062a\u0639\u062f\u064a\u0644 \u0645\u0631\u0626\u064a\u0629 \u0644\u0644\u0623\u062f\u0645\u0646 \u0641\u0642\u0637",
  pageSettings: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629",
  pageSettingsDesc: "\u063a\u064a\u0651\u0631 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0627\u0644\u0648\u0635\u0641 \u0648\u062e\u0635\u0627\u0626\u0635 \u0627\u0644\u0635\u0641\u062d\u0629",
  systemSettings: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0646\u0638\u0627\u0645",
  systemSettingsDesc: "\u062a\u062d\u0643\u0645 \u0641\u064a \u0627\u0644\u062d\u0627\u0644\u0627\u062a \u0648\u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0648\u0627\u0644\u0645\u0645\u064a\u0632\u0627\u062a",
  enabled: "\u0645\u0641\u0639\u0651\u0644",
  disabled: "\u0645\u062a\u0648\u0642\u0641",
  close: "\u0625\u063a\u0644\u0627\u0642",
  activeBanner: "\u0648\u0636\u0639 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0635\u0641\u062d\u0629 \u0645\u0641\u0639\u0651\u0644",
};

export function AdminEditButton({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [editEnabled, setEditEnabled] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const canEdit = role === "developer" || role === "admin";

  const pageKey = useMemo(() => {
    if (pathname === "/") return "dashboard";
    return pathname.replace(/^\//, "") || "dashboard";
  }, [pathname]);

  useEffect(() => {
    if (!canEdit) return;
    setEditEnabled(localStorage.getItem("elitecrm-admin-edit-mode") === "true");
  }, [canEdit]);

  if (!canEdit) return null;

  function setEditMode(next: boolean) {
    setEditEnabled(next);
    localStorage.setItem("elitecrm-admin-edit-mode", String(next));
    window.dispatchEvent(new CustomEvent("elitecrm-admin-edit-mode", { detail: next }));
  }

  function openPageSettings() {
    router.push("/customize?page=" + encodeURIComponent(pageKey));
    setPanelOpen(false);
  }

  function openSystemSettings() {
    router.push("/customize");
    setPanelOpen(false);
  }

  return (
    <>
      {editEnabled ? (
        <div className="fixed inset-x-4 top-24 z-[70] mx-auto flex max-w-xl items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-black text-emerald-200 shadow-2xl backdrop-blur">
          <CheckCircle2 className="h-4 w-4" />
          {labels.activeBanner}
        </div>
      ) : null}

      {panelOpen ? (
        <button
          type="button"
          aria-label={labels.close}
          onClick={() => setPanelOpen(false)}
          className="fixed inset-0 z-[78] bg-black/20 backdrop-blur-[1px]"
        />
      ) : null}

      <div className="fixed bottom-5 end-5 z-[80] w-[min(360px,calc(100vw-2rem))]">
        {panelOpen ? (
          <div className="mb-3 rounded-[1.7rem] border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-2xl">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="text-sm font-black">{labels.tools}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {labels.toolsHint}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-xl bg-white/10 p-2 text-slate-200 hover:bg-white/20"
                aria-label={labels.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditMode(!editEnabled)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-start transition hover:bg-white/10"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Edit3 className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black">{labels.editMode}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {labels.editModeDesc}
                </span>
              </span>

              <span
                className={
                  "rounded-full px-3 py-1 text-xs font-black " +
                  (editEnabled
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-white/10 text-slate-300")
                }
              >
                {editEnabled ? labels.enabled : labels.disabled}
              </span>
            </button>

            <button
              type="button"
              onClick={openPageSettings}
              className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-start transition hover:bg-white/10"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                <PanelTopOpen className="h-5 w-5" />
              </span>

              <span>
                <span className="block text-sm font-black">{labels.pageSettings}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {labels.pageSettingsDesc}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={openSystemSettings}
              className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-start transition hover:bg-white/10"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                <Settings2 className="h-5 w-5" />
              </span>

              <span>
                <span className="block text-sm font-black">{labels.systemSettings}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {labels.systemSettingsDesc}
                </span>
              </span>
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setPanelOpen((value) => !value)}
          className={
            "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-black shadow-2xl transition " +
            (panelOpen
              ? "bg-white text-slate-950"
              : "bg-emerald-400 text-slate-950 hover:bg-emerald-300")
          }
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            {labels.tools}
          </span>

          {editEnabled ? (
            <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] text-emerald-300">
              {labels.enabled}
            </span>
          ) : null}
        </button>
      </div>
    </>
  );
}
