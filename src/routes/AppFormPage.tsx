import { useEffect } from "react";
import { RunningEnvironment, SourceType } from "generated/client/enums";
import { Activity, ArrowLeft, Bell, Info, Package } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import {
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
import { Button } from "@/components/ui/button";
import { useApp, useCreateApp, useUpdateApp } from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";
import type { App } from "@/types";

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

  const handleCancel = () => {
    navigate("/");
  };

  if (loadingApp) {
    return <LoadingState />;
  }

  const basePath = isNewApp ? "/new" : `/${appIdParam}`;
  const isBasic =
    location.pathname === basePath || location.pathname === `${basePath}/basic`;
  const isVersion = location.pathname === `${basePath}/version`;
  const isPing = location.pathname === `${basePath}/ping`;
  const isNotifications =
    !isNewApp && location.pathname === `${basePath}/notifications`;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {app?.id ? "Edit App" : "Add New App"}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} type="button">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Apps
            </Button>
            <Button type="submit">{app?.id ? "Update App" : "Add App"}</Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure your homelab service details
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-4">
            <nav className="flex flex-row lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-x-visible">
              <Button
                variant={isBasic ? "secondary" : "ghost"}
                className="sm:w-full justify-start shrink-0 lg:shrink"
                type="button"
                onClick={() => navigate(basePath)}
              >
                <Info className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Basic Information</span>
              </Button>
              <Button
                variant={isVersion ? "secondary" : "ghost"}
                className="sm:w-full justify-start shrink-0 lg:shrink"
                type="button"
                onClick={() => navigate(`${basePath}/version`)}
              >
                <Package className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Version Checking</span>
              </Button>
              <Button
                variant={isPing ? "secondary" : "ghost"}
                className="sm:w-full justify-start shrink-0 lg:shrink"
                type="button"
                onClick={() => navigate(`${basePath}/ping`)}
              >
                <Activity className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Ping Monitoring</span>
              </Button>
              {app?.id && (
                <Button
                  variant={isNotifications ? "secondary" : "ghost"}
                  className="sm:w-full justify-start shrink-0 lg:shrink"
                  type="button"
                  onClick={() => navigate(`${basePath}/notifications`)}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Notifications</span>
                </Button>
              )}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full">
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
    </form>
  );
}
