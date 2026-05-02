import { ThemeContext, useThemeState } from "@/lib/use-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeState = useThemeState();
  return (
    <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>
  );
}
