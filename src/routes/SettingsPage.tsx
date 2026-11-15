import { Bell, Settings } from "lucide-react";
import { Route, Routes, useLocation } from "react-router-dom";

import { GeneralSettingsContent } from "@/components/GeneralSettingsContent";
import { NotificationsSettingsContent } from "@/components/NotificationsSettingsContent";
import { PageHeader } from "@/components/primitives";
import { SideNav } from "@/components/SideNav";

import packageJson from "../../package.json";

export function SettingsPage() {
  const location = useLocation();
  const isNotifications = location.pathname === "/settings/notifications";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your application settings"
      />
      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <div className="md:sticky md:top-20">
            <SideNav
              label="Settings sections"
              items={[
                {
                  to: "/settings",
                  label: "General",
                  icon: Settings,
                  active: !isNotifications,
                },
                {
                  to: "/settings/notifications",
                  label: "Notifications",
                  icon: Bell,
                  active: isNotifications,
                },
              ]}
            />
            <p className="mt-4 hidden px-3 font-mono text-xs text-muted md:block">
              v{packageJson.version}
            </p>
          </div>
        </aside>
        <div className="min-w-0 max-w-3xl flex-1">
          <Routes>
            <Route index element={<GeneralSettingsContent />} />
            <Route
              path="notifications"
              element={<NotificationsSettingsContent />}
            />
          </Routes>
        </div>
      </div>
    </>
  );
}
