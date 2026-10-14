import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type ResolvedTheme = "dark" | "light";

interface ThemeContextType {
  /** The visitor's explicit choice, or null when the site is following their device. */
  theme: ResolvedTheme | null;
  setTheme: (theme: ResolvedTheme) => void;
  toggleTheme: () => void;
  resolvedTheme: ResolvedTheme;
}

const STORAGE_KEY = "theme";
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredTheme(): ResolvedTheme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Older versions stored "system"; treat it, and anything unknown, as "follow the device".
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Follows the visitor's device setting until they pick light or dark themselves.
 * index.html applies the same rule before first paint, so there is no flash.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ResolvedTheme | null>(() =>
    typeof window === "undefined" ? null : readStoredTheme()
  );
  const [system, setSystem] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "dark" : systemTheme()
  );

  const resolvedTheme = theme ?? system;

  // Keep up with the device switching between light and dark (for example at sunset).
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ResolvedTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse storage; the choice still applies for this visit.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
