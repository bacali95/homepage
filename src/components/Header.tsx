import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SettingsMenu } from "./SettingsMenu";

interface HeaderProps {
  onAdd: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckUpdates: () => void;
  onSettings: () => void;
  isImporting: boolean;
  isCheckingUpdates: boolean;
}

export function Header({
  onAdd,
  onExport,
  onImport,
  onCheckUpdates,
  onSettings,
  isImporting,
  isCheckingUpdates,
}: HeaderProps) {
  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
        <div className="flex items-start gap-3">
          <img
            src="/favicon.svg"
            alt="Homepage"
            className="h-16 w-16 shrink-0 mt-1"
          />
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-linear-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              Homepage
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage and monitor your self-hosted applications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={onAdd}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add App</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <SettingsMenu
            onExport={onExport}
            onImport={onImport}
            onCheckUpdates={onCheckUpdates}
            onSettings={onSettings}
            isImporting={isImporting}
            isCheckingUpdates={isCheckingUpdates}
          />
        </div>
      </div>
    </div>
  );
}
