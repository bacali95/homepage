import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
  RefreshCw,
  MoreVertical,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
} from "lucide-react";
import { useTheme, type Theme } from "@/lib/use-theme";

interface SettingsMenuProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckUpdates: () => void;
  isImporting: boolean;
  isCheckingUpdates: boolean;
}

export function SettingsMenu({
  onExport,
  onImport,
  onCheckUpdates,
  isImporting,
  isCheckingUpdates,
}: SettingsMenuProps) {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset file input when import completes
  useEffect(() => {
    if (!isImporting && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [isImporting]);

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.findIndex((t) => t === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  return (
    <>
      <Menu
        trigger={
          <MenuTrigger>
            <Button
              variant="outline"
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </MenuTrigger>
        }
      >
        <MenuItem onClick={cycleTheme}>
          <div className="flex items-center gap-2">
            {getThemeIcon()}
            <span>Theme: {getThemeLabel()}</span>
          </div>
        </MenuItem>
        <MenuItem onClick={onExport}>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export Backup</span>
          </div>
        </MenuItem>
        <MenuItem
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <div className="flex items-center gap-2">
            <Upload
              className={`h-4 w-4 ${isImporting ? "animate-pulse" : ""}`}
            />
            <span>{isImporting ? "Importing..." : "Import Backup"}</span>
          </div>
        </MenuItem>
        <MenuItem onClick={onCheckUpdates} disabled={isCheckingUpdates}>
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`h-4 w-4 ${isCheckingUpdates ? "animate-spin" : ""}`}
            />
            <span>{isCheckingUpdates ? "Checking..." : "Check Updates"}</span>
          </div>
        </MenuItem>
      </Menu>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onImport}
        className="hidden"
        id="import-file-input"
      />
    </>
  );
}
