import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to system
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    theme === "system" ? getSystemTheme() : theme
  );

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResolvedTheme(theme);
      return;
    }

    setResolvedTheme(getSystemTheme());

    const handleMediaQuery = (e: MediaQueryListEvent | MediaQueryList) =>
      setResolvedTheme(getSystemTheme(e));

    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

    mediaQuery.addEventListener("change", handleMediaQuery);

    return () => mediaQuery.removeEventListener("change", handleMediaQuery);
  }, [theme]);

  const setThemeWithStorage = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeWithStorage,
  };
}

function getSystemTheme(e?: MediaQueryList | MediaQueryListEvent) {
  if (typeof window === "undefined") return "light";

  if (!e) e = window.matchMedia(THEME_MEDIA_QUERY);

  return e.matches ? "dark" : "light";
}
