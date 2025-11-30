import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { type App, type SourceType } from "@/lib/api";
import { AppForm, type FormData } from "@/components/AppForm";
import {
  useApps,
  useCategories,
  useCreateApp,
  useUpdateApp,
} from "@/lib/use-apps";
import { toast } from "@/lib/use-toast";
import { LoadingState } from "@/components/LoadingState";
import { Card } from "@/components/ui/card";

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Button variant="outline" onClick={handleCancel} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Apps
        </Button>
        <h1 className="text-4xl font-bold mb-2">
          {editingApp ? "Edit App" : "Add New App"}
        </h1>
        <p className="text-muted-foreground">
          Configure your homelab service details
        </p>
      </div>

      <Card className="p-6">
        <AppForm
          formData={formData}
          categories={categories}
          editingApp={!!editingApp}
          editingAppId={editingApp?.id || null}
          onFormDataChange={handleFormDataChange}
          onSourceTypeChange={handleSourceTypeChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
}
