import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to system
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  });

  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Apply the resolved theme
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    // Update resolved theme when theme preference changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateResolvedTheme = () => {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      };

      // Set initial value
      updateResolvedTheme();

      // Listen for changes
      mediaQuery.addEventListener("change", updateResolvedTheme);
      return () =>
        mediaQuery.removeEventListener("change", updateResolvedTheme);
    } else {
      setResolvedTheme(theme);
    }
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
