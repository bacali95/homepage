import type { Theme } from "@/lib/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/lib/use-theme";

export function GeneralSettingsContent() {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">General</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure general application preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              {getThemeIcon()}
              <div>
                <h3 className="text-xl font-semibold">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </Select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
