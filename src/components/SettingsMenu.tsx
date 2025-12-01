import { MoreVertical, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";

interface SettingsMenuProps {
  onAdd: () => void;
  onCheckUpdates: () => void;
  isCheckingUpdates: boolean;
}

export function SettingsMenu({
  onAdd,
  onCheckUpdates,
  isCheckingUpdates,
}: SettingsMenuProps) {
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
        <MenuItem onClick={onAdd}>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add App</span>
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
    </>
  );
}
