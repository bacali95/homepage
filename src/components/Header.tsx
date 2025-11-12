import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SettingsMenu } from "./SettingsMenu";

interface HeaderProps {
  onAdd: () => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckUpdates: () => void;
  isImporting: boolean;
  isCheckingUpdates: boolean;
}

export function Header({
  onAdd,
  editMode,
  onToggleEditMode,
  onExport,
  onImport,
  onCheckUpdates,
  isImporting,
  isCheckingUpdates,
}: HeaderProps) {
  return (
    <div className="mb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
            Homepage
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage and monitor your self-hosted applications
          </p>
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
            editMode={editMode}
            onToggleEditMode={onToggleEditMode}
            onExport={onExport}
            onImport={onImport}
            onCheckUpdates={onCheckUpdates}
            isImporting={isImporting}
            isCheckingUpdates={isCheckingUpdates}
          />
        </div>
      </div>
    </div>
  );
}
