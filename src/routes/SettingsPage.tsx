import { useLocation, useNavigate, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, Bell, Database } from "lucide-react";
import { GeneralSettingsContent } from "@/components/GeneralSettingsContent";
import { NotificationsSettingsContent } from "@/components/NotificationsSettingsContent";
import { BackupSettingsContent } from "@/components/BackupSettingsContent";

export function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGeneral = location.pathname === "/settings";
  const isNotifications = location.pathname === "/settings/notifications";
  const isBackup = location.pathname === "/settings/backup";

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-4">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your application settings
            </p>
          </div>
          <nav className="flex flex-row lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-x-visible">
            <Button
              variant={isGeneral ? "secondary" : "ghost"}
              className="sm:w-full justify-start shrink-0 lg:shrink"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">General</span>
            </Button>
            <Button
              variant={isNotifications ? "secondary" : "ghost"}
              className="sm:w-full justify-start shrink-0 lg:shrink"
              onClick={() => navigate("/settings/notifications")}
            >
              <Bell className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Notifications</span>
            </Button>
            <Button
              variant={isBackup ? "secondary" : "ghost"}
              className="sm:w-full justify-start shrink-0 lg:shrink"
              onClick={() => navigate("/settings/backup")}
            >
              <Database className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Backup & Restore</span>
            </Button>
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 w-full">
        <Routes>
          <Route index element={<GeneralSettingsContent />} />
          <Route
            path="notifications"
            element={<NotificationsSettingsContent />}
          />
          <Route path="backup" element={<BackupSettingsContent />} />
        </Routes>
      </div>
    </div>
  );
}
