import { useEffect } from "react";
import { Button } from "@ui-sdk/react/button";
import { Activity, ArrowLeft, Bell, Info, Package } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { BasicInformationSection } from "@/components/app-form/BasicInformationSection";
import { NotificationPreferencesSection } from "@/components/app-form/NotificationPreferencesSection";
import { PingConfigurationSection } from "@/components/app-form/PingConfigurationSection";
import { VersionCheckingSection } from "@/components/app-form/VersionCheckingSection";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/primitives";
import { SideNav } from "@/components/SideNav";
import { useApp, useCreateApp, useUpdateApp } from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";
import type { App } from "@/types";

import { RunningEnvironment, SourceType } from "../../generated/client/enums";

const initialFormData: Partial<App> = {
  name: "",
  url: "",
  category: "",
  icon: "",
  versionPreferences: {
    appId: 0,
    enabled: false,
    sourceType: SourceType.GITHUB_RELEASES,
    sourceRepo: "",
    runningEnvironment: RunningEnvironment.KUBERNETES,
    runningConfig: "{}",
    currentVersion: null,
    latestVersion: null,
    hasUpdate: false,
    versionExtractionRegex: null,
  },
  pingPreferences: {
    appId: 0,
    enabled: false,
    url: "",
    frequency: 1,
    ignoreSsl: false,
  },
  appNotificationPreferences: [],
};

export function AppFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { app: appIdParam } = useParams<{ app: string }>();
  const { data: app, isLoading: loadingApp } = useApp(
    parseInt(appIdParam ?? "0", 10)
  );
  const createAppMutation = useCreateApp();
  const updateAppMutation = useUpdateApp();

  const form = useForm<Partial<App>>({
    defaultValues: initialFormData,
  });

  const isNewApp = appIdParam === "new";

  // Load app data if editing
  useEffect(() => {
    if (app && !isNewApp) {
      form.reset(app);
    } else if (isNewApp) {
      form.reset(initialFormData);
    }
  }, [app, isNewApp, form]);

  const handleSubmit = async (data: Partial<App>) => {
    try {
      if (app?.id) {
        await updateAppMutation.mutateAsync(data as App);
        toast.success("App updated successfully");
      } else {
        await createAppMutation.mutateAsync(data as App);
        toast.success("App created successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Error saving app:", error);
      toast.error(
        "Error saving app",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  if (loadingApp) {
    return <LoadingState label="Loading app" />;
  }

  const basePath = isNewApp ? "/new" : `/${appIdParam}`;
  const isBasic =
    location.pathname === basePath || location.pathname === `${basePath}/basic`;
  const isVersion = location.pathname === `${basePath}/version`;
  const isPing = location.pathname === `${basePath}/ping`;
  const isNotifications =
    !isNewApp && location.pathname === `${basePath}/notifications`;
  const saving = createAppMutation.isPending || updateAppMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <PageHeader
        title={app?.id ? "Edit app" : "Add new app"}
        description="Configure your homelab service details"
      />

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <div className="md:sticky md:top-20">
            <SideNav
              label="App settings"
              items={[
                {
                  to: basePath,
                  label: "Basic information",
                  icon: Info,
                  active: isBasic,
                },
                {
                  to: `${basePath}/version`,
                  label: "Version checking",
                  icon: Package,
                  active: isVersion,
                },
                {
                  to: `${basePath}/ping`,
                  label: "Ping monitoring",
                  icon: Activity,
                  active: isPing,
                },
                ...(app?.id
                  ? [
                      {
                        to: `${basePath}/notifications`,
                        label: "Notifications",
                        icon: Bell,
                        active: isNotifications,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </aside>

        <div className="min-w-0 max-w-3xl flex-1">
          <FormProvider {...form}>
            <Routes>
              <Route index element={<BasicInformationSection />} />
              <Route path="basic" element={<BasicInformationSection />} />
              <Route path="version" element={<VersionCheckingSection />} />
              <Route path="ping" element={<PingConfigurationSection />} />
              {app?.id && (
                <Route
                  path="notifications"
                  element={<NotificationPreferencesSection />}
                />
              )}
            </Routes>
          </FormProvider>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <p className="hidden text-xs text-muted sm:block">
          {form.formState.isDirty
            ? "You have unsaved changes."
            : "No changes yet."}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Button render={<Link to="/" />}>
            <ArrowLeft aria-hidden="true" />
            Back to apps
          </Button>
          <Button type="submit" data-variant="solid" disabled={saving}>
            {saving ? "Saving…" : app?.id ? "Update App" : "Add App"}
          </Button>
        </div>
      </div>
    </form>
  );
}
