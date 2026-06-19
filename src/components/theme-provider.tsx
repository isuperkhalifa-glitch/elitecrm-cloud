"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeStorageKey = "elitecrm-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    const initialTheme: Theme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    applyTheme(initialTheme);

    function syncTheme(event: StorageEvent) {
      if (event.key !== themeStorageKey) return;
      const nextTheme: Theme = event.newValue === "dark" ? "dark" : "light";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    }

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme: Theme = current === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      window.localStorage.setItem(themeStorageKey, nextTheme);
      return nextTheme;
    });
  }

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("Missing ThemeProvider");
  return context;
}
