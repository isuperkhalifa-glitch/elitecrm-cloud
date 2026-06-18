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

function clearScopeStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("elitecrm-global-scope");
  document.cookie = "elitecrm-scope=; path=/; max-age=0; SameSite=Lax";
}

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<GlobalScope>(defaultScope);

  useEffect(() => {
    clearScopeStorage();
    setScopeState(defaultScope);
  }, []);

  function setScope() {
    clearScopeStorage();
    setScopeState(defaultScope);
  }

  function resetScope() {
    clearScopeStorage();
    setScopeState(defaultScope);
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