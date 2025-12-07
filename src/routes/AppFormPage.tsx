import type { FormData } from "@/components/app-form/types";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Bell, Info, Package } from "lucide-react";
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
import { type App, type SourceType } from "@/lib/api";
import {
  useApps,
  useCategories,
  useCreateApp,
  useUpdateApp,
} from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";

const initialFormData: FormData = {
  name: "",
  url: "",
  repo: "",
  source_type: "github",
  current_version: "",
  category: "",
  docker_image: "",
  k8s_namespace: "",
  icon: "",
  enableVersionChecking: false,
  ping_enabled: false,
  ping_url: "",
  ping_frequency: "5",
};

// Helper function to determine if version checking should be enabled
const shouldEnableVersionChecking = (data: App): boolean => {
  return !!(
    (data.repo && data.repo.trim()) ||
    (data.docker_image && data.docker_image.trim()) ||
    (data.k8s_namespace && data.k8s_namespace.trim()) ||
    (data.current_version && data.current_version.trim())
  );
};

export function AppFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { app: appIdParam } = useParams<{ app: string }>();
  const { data: apps = [], isLoading: loadingApps } = useApps();
  const { data: categories = [] } = useCategories();
  const createAppMutation = useCreateApp();
  const updateAppMutation = useUpdateApp();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingApp, setEditingApp] = useState<App | null>(null);

  const isNewApp = appIdParam === "new";
  const appId = isNewApp ? null : appIdParam ? parseInt(appIdParam, 10) : null;

  // Load app data if editing
  useEffect(() => {
    if (appId && !isNewApp && apps.length > 0) {
      const app = apps.find((a) => a.id === appId);
      if (app) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditingApp(app);
        const sourceType = app.source_type || "github";
        setFormData({
          name: app.name,
          url: app.url || "",
          repo: app.repo || "",
          source_type: sourceType,
          current_version: app.current_version || "",
          category: app.category || "",
          docker_image: app.docker_image || "",
          k8s_namespace: app.k8s_namespace || "",
          icon: app.icon || "",
          enableVersionChecking: shouldEnableVersionChecking(app),
          ping_enabled: app.ping_enabled || false,
          ping_url: app.ping_url || "",
          ping_frequency: app.ping_frequency?.toString() || "5",
        });
      } else {
        // App not found, redirect to home
        navigate("/");
        toast.error("App not found");
      }
    } else if (isNewApp) {
      // Reset form for new app
      setEditingApp(null);
      setFormData(initialFormData);
    }
  }, [appId, isNewApp, apps, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        url: formData.url.trim(),
        ping_url: formData.ping_url.trim(),
        ping_frequency:
          formData.ping_enabled && formData.ping_frequency
            ? parseInt(formData.ping_frequency, 10)
            : null,
      };
      if (editingApp && appId) {
        await updateAppMutation.mutateAsync({
          id: appId,
          app: submitData,
        });
        toast.success("App updated successfully");
      } else {
        await createAppMutation.mutateAsync(submitData);
        toast.success("App created successfully");
      }

      navigate("/");
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

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData({ ...formData, ...data });
  };

  const handleSourceTypeChange = (sourceType: SourceType) => {
    setFormData({
      ...formData,
      source_type: sourceType,
      repo: "",
      current_version: "",
      docker_image: formData.docker_image, // Keep docker_image when changing source type
    });
  };

  if (loadingApps) {
    return <LoadingState />;
  }

  const basePath = isNewApp ? "/new" : `/${appIdParam}`;
  const isBasic =
    location.pathname === basePath || location.pathname === `${basePath}/basic`;
  const isVersion = location.pathname === `${basePath}/version`;
  const isPing = location.pathname === `${basePath}/ping`;
  const isNotifications =
    !isNewApp && location.pathname === `${basePath}/notifications`;

  const getBasePath = () => {
    if (isNewApp) return "/new";
    return `/${appIdParam}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {editingApp ? "Edit App" : "Add New App"}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} type="button">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Apps
            </Button>
            <Button type="submit">
              {editingApp ? "Update App" : "Add App"}
            </Button>
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
                onClick={() => navigate(getBasePath())}
              >
                <Info className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Basic Information</span>
              </Button>
              <Button
                variant={isVersion ? "secondary" : "ghost"}
                className="sm:w-full justify-start shrink-0 lg:shrink"
                type="button"
                onClick={() => navigate(`${getBasePath()}/version`)}
              >
                <Package className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Version Checking</span>
              </Button>
              <Button
                variant={isPing ? "secondary" : "ghost"}
                className="sm:w-full justify-start shrink-0 lg:shrink"
                type="button"
                onClick={() => navigate(`${getBasePath()}/ping`)}
              >
                <Activity className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Ping Monitoring</span>
              </Button>
              {editingApp && editingApp?.id && (
                <Button
                  variant={isNotifications ? "secondary" : "ghost"}
                  className="sm:w-full justify-start shrink-0 lg:shrink"
                  type="button"
                  onClick={() => navigate(`/${editingApp.id}/notifications`)}
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
          <Routes>
            <Route
              index
              element={
                <BasicInformationSection
                  formData={formData}
                  categories={categories}
                  onFormDataChange={handleFormDataChange}
                />
              }
            />
            <Route
              path="basic"
              element={
                <BasicInformationSection
                  formData={formData}
                  categories={categories}
                  onFormDataChange={handleFormDataChange}
                />
              }
            />
            <Route
              path="version"
              element={
                <VersionCheckingSection
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                  onSourceTypeChange={handleSourceTypeChange}
                />
              }
            />
            <Route
              path="ping"
              element={
                <PingConfigurationSection
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                />
              }
            />
            {editingApp && editingApp.id && (
              <Route
                path="notifications"
                element={
                  <NotificationPreferencesSection appId={editingApp.id} />
                }
              />
            )}
          </Routes>
        </div>
      </div>
    </form>
  );
}
