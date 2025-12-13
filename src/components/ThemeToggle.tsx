import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/lib/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];

  const cycleTheme = () => {
    const currentIndex = themes.findIndex((t) => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="shadow-sm hover:shadow-md transition-shadow"
      title={`Theme: ${currentTheme.label} (click to cycle)`}
      aria-label={`Current theme: ${currentTheme.label}. Click to cycle themes.`}
    >
      {currentTheme.icon}
    </Button>
  );
}
