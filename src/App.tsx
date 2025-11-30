import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { type App, type SourceType } from "@/lib/api";
import { groupAppsByCategory, sortCategories } from "@/lib/utils";
import { AppForm, type FormData } from "@/components/AppForm";
import {
  useApps,
  useCategories,
  useCreateApp,
  useUpdateApp,
  useDeleteApp,
  useCheckUpdates,
  useCheckAppUpdates,
  useImportApps,
} from "@/lib/use-apps";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { AppsGrid } from "@/components/AppsGrid";
import { Header } from "@/components/Header";
import { SettingsPage } from "@/components/SettingsPage";
import {
  useExportApps,
  useImportApps as useImportAppsHelper,
} from "@/lib/use-export-import";
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
};

// Helper function to determine if version checking should be enabled
// Enable if any field in the version checking sections has a value
const shouldEnableVersionChecking = (data: App): boolean => {
  return !!(
    (data.repo && data.repo.trim()) ||
    (data.docker_image && data.docker_image.trim()) ||
    (data.k8s_namespace && data.k8s_namespace.trim()) ||
    (data.current_version && data.current_version.trim())
  );
};

export default function App() {
  const { data: apps = [], isLoading: loadingApps } = useApps();
  const { data: categories = [] } = useCategories();
  const createAppMutation = useCreateApp();
  const updateAppMutation = useUpdateApp();
  const deleteAppMutation = useDeleteApp();
  const checkUpdatesMutation = useCheckUpdates();
  const checkAppUpdatesMutation = useCheckAppUpdates();
  const importAppsMutation = useImportApps();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showSettings, setShowSettings] = useState(false);
  const exportApps = useExportApps();
  const importAppsHelper = useImportAppsHelper();

  const loading = loadingApps;

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (drawerOpen) {
          setDrawerOpen(false);
          setEditingApp(null);
          setFormData(initialFormData);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        url: formData.url.trim(),
      };
      if (editingApp) {
        await updateAppMutation.mutateAsync({
          id: editingApp.id,
          app: submitData,
        });
        toast.success("App updated successfully");
      } else {
        await createAppMutation.mutateAsync(submitData);
        toast.success("App created successfully");
      }

      resetForm();
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error saving app:", error);
      toast.error(
        "Error saving app",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const handleEdit = (app: App) => {
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
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this app?")) {
      try {
        await deleteAppMutation.mutateAsync(id);
        toast.success("App deleted successfully");
      } catch (error) {
        console.error("Error deleting app:", error);
        toast.error(
          "Error deleting app",
          error instanceof Error ? error.message : "Please try again."
        );
      }
    }
  };

  const handleCheckAppUpdates = async (app: App) => {
    try {
      await checkAppUpdatesMutation.mutateAsync(app.id);
      toast.success(
        "Update check completed",
        `Checked for updates for ${app.name}`
      );
    } catch (error) {
      console.error("Error checking updates:", error);
      toast.error(
        "Error checking updates",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const resetForm = () => {
    setEditingApp(null);
    setFormData(initialFormData);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    resetForm();
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

  const handleCheckUpdates = async () => {
    try {
      await checkUpdatesMutation.mutateAsync();
      toast.success("Updates checked successfully");
    } catch (error) {
      console.error("Error checking updates:", error);
      toast.error(
        "Error checking for updates",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const handleExport = () => {
    try {
      exportApps(apps);
      toast.success("Apps exported successfully");
    } catch (error) {
      console.error("Error exporting apps:", error);
      toast.error(
        "Failed to export apps",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { validApps, errors } = await importAppsHelper(file);

      if (validApps.length === 0) {
        toast.error(
          "No valid apps to import",
          errors.length > 0 ? errors.join(", ") : undefined
        );
        return;
      }

      // Show confirmation dialog
      const confirmed = confirm(
        `This will import ${validApps.length} app(s). ${
          errors.length > 0 ? `\n\nWarnings:\n${errors.join("\n")}` : ""
        }\n\nDo you want to continue?`
      );

      if (!confirmed) {
        return;
      }

      // Import apps
      const result = await importAppsMutation.mutateAsync(validApps);

      if (result.success) {
        const details: string[] = [];
        if (result.created > 0) {
          details.push(`${result.created} created`);
        }
        if (result.updated > 0) {
          details.push(`${result.updated} updated`);
        }
        const detailMessage =
          details.length > 0 ? ` (${details.join(", ")})` : "";

        toast.success(
          `Successfully imported ${result.imported} app(s)${detailMessage}`,
          result.errors && result.errors.length > 0
            ? `Some errors occurred: ${result.errors.join(", ")}`
            : undefined
        );
      } else {
        toast.error(
          "Failed to import apps",
          "Please check the console for details."
        );
      }
    } catch (error) {
      console.error("Error importing apps:", error);
      toast.error(
        "Failed to import apps",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  const groupedApps = groupAppsByCategory(apps);
  const sortedCategories = sortCategories(Object.keys(groupedApps));

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/10">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div>
          <Header
            onAdd={handleAdd}
            onExport={handleExport}
            onImport={handleImport}
            onCheckUpdates={handleCheckUpdates}
            onSettings={() => setShowSettings(true)}
            isImporting={importAppsMutation.isPending}
            isCheckingUpdates={checkUpdatesMutation.isPending}
          />

          {apps.length === 0 ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <AppsGrid
              groupedApps={groupedApps}
              sortedCategories={sortedCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCheckUpdates={handleCheckAppUpdates}
            />
          )}

          {/* Form Drawer */}
          <Drawer
            isOpen={drawerOpen}
            onClose={closeDrawer}
            title={editingApp ? "Edit App" : "Add New App"}
            description="Configure your homelab service details"
          >
            <AppForm
              formData={formData}
              categories={categories}
              editingApp={!!editingApp}
              editingAppId={editingApp?.id || null}
              onFormDataChange={handleFormDataChange}
              onSourceTypeChange={handleSourceTypeChange}
              onSubmit={handleSubmit}
              onCancel={closeDrawer}
            />
          </Drawer>
        </div>
      </main>
    </div>
  );
}
