import { Bell, Settings } from "lucide-react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { GeneralSettingsContent } from "@/components/GeneralSettingsContent";
import { NotificationsSettingsContent } from "@/components/NotificationsSettingsContent";
import { Button } from "@/components/ui/button";

export function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGeneral = location.pathname === "/settings";
  const isNotifications = location.pathname === "/settings/notifications";

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="md:sticky md:top-4">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your application settings
            </p>
          </div>
          <nav className="flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-x-visible">
            <Button
              variant={isGeneral ? "secondary" : "ghost"}
              className="md:w-full justify-start shrink-0 md:shrink"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">General</span>
            </Button>
            <Button
              variant={isNotifications ? "secondary" : "ghost"}
              className="md:w-full justify-start shrink-0 md:shrink"
              onClick={() => navigate("/settings/notifications")}
            >
              <Bell className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Notifications</span>
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
        </Routes>
      </div>
    </div>
  );
}
