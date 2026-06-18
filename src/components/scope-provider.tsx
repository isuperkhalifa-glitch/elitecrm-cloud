"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ScopeMode = "all" | "user" | "company";
export type ScopePreviewMode = "admin" | "selected";

export type GlobalScope = {
  mode: ScopeMode;
  targetId: string;
  targetName: string;
  targetRole: string;
  previewMode: ScopePreviewMode;
};

type ScopeContextValue = {
  scope: GlobalScope;
  setScope: (nextScope: GlobalScope) => void;
  resetScope: () => void;
};

const defaultScope: GlobalScope = {
  mode: "all",
  targetId: "",
  targetName: "",
  targetRole: "",
  previewMode: "admin",
};

const ScopeContext = createContext<ScopeContextValue | null>(null);

function safeParseScope(value: string | null): GlobalScope {
  if (!value) return defaultScope;

  try {
    const parsed = JSON.parse(value) as Partial<GlobalScope>;
    return {
      ...defaultScope,
      ...parsed,
      mode: parsed.mode === "user" || parsed.mode === "company" ? parsed.mode : "all",
      previewMode: parsed.previewMode === "selected" ? "selected" : "admin",
      targetId: parsed.targetId ?? "",
      targetName: parsed.targetName ?? "",
      targetRole: parsed.targetRole ?? "",
    };
  } catch {
    return defaultScope;
  }
}

function saveScopeCookie(scope: GlobalScope) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(scope));
  document.cookie = `elitecrm-scope=${value}; path=/; max-age=2592000; SameSite=Lax`;
}

function clearScopeCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "elitecrm-scope=; path=/; max-age=0; SameSite=Lax";
}

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<GlobalScope>(defaultScope);

  useEffect(() => {
    const saved = window.localStorage.getItem("elitecrm-global-scope");
    const parsed = safeParseScope(saved);
    setScopeState(parsed);
    if (parsed.mode !== "all") saveScopeCookie(parsed);
  }, []);

  function setScope(nextScope: GlobalScope) {
    const normalized: GlobalScope = {
      ...defaultScope,
      ...nextScope,
      mode: nextScope.mode,
      previewMode: nextScope.previewMode,
      targetId: nextScope.targetId ?? "",
      targetName: nextScope.targetName ?? "",
      targetRole: nextScope.targetRole ?? "",
    };

    setScopeState(normalized);

    if (normalized.mode === "all") {
      window.localStorage.removeItem("elitecrm-global-scope");
      clearScopeCookie();
      return;
    }

    window.localStorage.setItem("elitecrm-global-scope", JSON.stringify(normalized));
    saveScopeCookie(normalized);
  }

  function resetScope() {
    setScope(defaultScope);
  }

  const value = useMemo(
    () => ({
      scope,
      setScope,
      resetScope,
    }),
    [scope]
  );

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  const context = useContext(ScopeContext);
  if (!context) throw new Error("Missing ScopeProvider");
  return context;
}