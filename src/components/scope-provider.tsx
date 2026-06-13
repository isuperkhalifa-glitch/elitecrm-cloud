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

function saveScopeCookie(scope: GlobalScope) {
  const value = encodeURIComponent(JSON.stringify(scope));
  document.cookie = `elitecrm-scope=${value}; path=/; max-age=2592000; SameSite=Lax`;
}

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<GlobalScope>(defaultScope);

  useEffect(() => {
    const saved = window.localStorage.getItem("elitecrm-global-scope");

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as GlobalScope;
      setScopeState({ ...defaultScope, ...parsed });
    } catch {
      setScopeState(defaultScope);
    }
  }, []);

  function setScope(nextScope: GlobalScope) {
    setScopeState(nextScope);
    window.localStorage.setItem("elitecrm-global-scope", JSON.stringify(nextScope));
    saveScopeCookie(nextScope);
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

  if (!context) {
    throw new Error("Missing ScopeProvider");
  }

  return context;
}
