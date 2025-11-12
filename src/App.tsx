import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
  Plus,
  Settings,
  RefreshCw,
  MoreVertical,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
} from "lucide-react";
import { api, type App, type SourceType } from "@/lib/api";
import { groupAppsByCategory, sortCategories } from "@/lib/utils";
import { AppCard } from "@/components/AppCard";
import { AppForm, type FormData } from "@/components/AppForm";
import { useTheme, type Theme } from "@/lib/use-theme";

const initialFormData: FormData = {
  name: "",
  url: "",
  repo: "",
  github_repo: "",
  source_type: "github",
  current_version: "",
  category: "",
  docker_image: "",
  k8s_namespace: "",
};

export default function App() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<string[]>([]);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [importing, setImporting] = useState(false);
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    loadApps();
    loadCategories();
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (drawerOpen) {
          setDrawerOpen(false);
          setEditingApp(null);
          setFormData(initialFormData);
        } else if (editMode) {
          setEditMode(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen, editMode]);

  const loadApps = async () => {
    try {
      const allApps = await api.getApps();
      setApps(allApps);
    } catch (error) {
      console.error("Error loading apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const fetchedCategories = await api.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        url: formData.url.trim(),
      };
      if (editingApp) {
        await api.updateApp(editingApp.id, submitData);
      } else {
        await api.createApp(submitData);
      }

      resetForm();
      await loadApps();
      await loadCategories();
      setDrawerOpen(false);
    } catch (error) {
      console.error("Error saving app:", error);
      alert("Error saving app. Please try again.");
    }
  };

  const handleEdit = (app: App) => {
    setEditingApp(app);
    const sourceType = app.source_type || "github";
    setFormData({
      name: app.name,
      url: app.url || "",
      repo: app.repo || app.github_repo,
      github_repo: app.github_repo || app.repo,
      source_type: sourceType,
      current_version: app.current_version,
      category: app.category || "",
      docker_image: app.docker_image || "",
      k8s_namespace: app.k8s_namespace || "",
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
        await api.deleteApp(id);
        await loadApps();
      } catch (error) {
        console.error("Error deleting app:", error);
        alert("Error deleting app. Please try again.");
      }
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
      github_repo: "",
      current_version: "",
      docker_image: formData.docker_image, // Keep docker_image when changing source type
    });
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      await api.checkUpdates();
      // Reload apps to show updated version information
      await loadApps();
    } catch (error) {
      console.error("Error checking updates:", error);
      alert("Error checking for updates. Please try again.");
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleExport = async () => {
    try {
      const apps = await api.exportApps();

      // Remove database-specific fields for export
      const exportData = apps.map((app) => {
        const {
          id,
          created_at,
          updated_at,
          latest_version,
          has_update,
          ...exportApp
        } = app;
        return exportApp;
      });

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `homepage-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting apps:", error);
      alert("Failed to export apps. Please try again.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const fileContent = await file.text();
      const apps = JSON.parse(fileContent) as Omit<
        App,
        "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
      >[];

      if (!Array.isArray(apps)) {
        throw new Error(
          "Invalid backup file format. Expected an array of apps."
        );
      }

      // Validate apps
      const errors: string[] = [];
      const validApps = apps.filter((app, index) => {
        if (!app.name) {
          errors.push(`App at index ${index}: Missing name`);
          return false;
        }
        if (!app.current_version) {
          errors.push(`App "${app.name}": Missing current_version`);
          return false;
        }
        if (!app.repo && !app.github_repo) {
          errors.push(`App "${app.name}": Missing repo or github_repo`);
          return false;
        }
        return true;
      });

      if (validApps.length === 0) {
        alert(`No valid apps to import. Errors:\n${errors.join("\n")}`);
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
      const result = await api.importApps(validApps);

      if (result.success) {
        alert(
          `Successfully imported ${result.imported} app(s).${
            result.errors && result.errors.length > 0
              ? `\n\nErrors:\n${result.errors.join("\n")}`
              : ""
          }`
        );
        await loadApps();
        await loadCategories();
      } else {
        alert("Failed to import apps. Please check the console for details.");
      }
    } catch (error) {
      console.error("Error importing apps:", error);
      if (error instanceof SyntaxError) {
        alert("Invalid JSON file. Please check the file format.");
      } else {
        alert(
          `Failed to import apps: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.findIndex((t) => t === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <main className="container mx-auto px-4 py-12">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading apps...</p>
          </div>
        </main>
      </div>
    );
  }

  const groupedApps = groupAppsByCategory(apps);
  const sortedCategories = sortCategories(Object.keys(groupedApps));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div>
          {/* Header */}
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
                  onClick={handleAdd}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add App</span>
                  <span className="sm:hidden">Add</span>
                </Button>
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
                  <MenuItem onClick={cycleTheme}>
                    <div className="flex items-center gap-2">
                      {getThemeIcon()}
                      <span>Theme: {getThemeLabel()}</span>
                    </div>
                  </MenuItem>
                  <MenuItem onClick={handleExport}>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Export Backup</span>
                    </div>
                  </MenuItem>
                  <MenuItem
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  >
                    <div className="flex items-center gap-2">
                      <Upload
                        className={`h-4 w-4 ${
                          importing ? "animate-pulse" : ""
                        }`}
                      />
                      <span>
                        {importing ? "Importing..." : "Import Backup"}
                      </span>
                    </div>
                  </MenuItem>
                  <MenuItem
                    onClick={handleCheckUpdates}
                    disabled={checkingUpdates}
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw
                        className={`h-4 w-4 ${
                          checkingUpdates ? "animate-spin" : ""
                        }`}
                      />
                      <span>
                        {checkingUpdates ? "Checking..." : "Check Updates"}
                      </span>
                    </div>
                  </MenuItem>
                  <MenuItem onClick={() => setEditMode(!editMode)}>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>{editMode ? "Exit Edit Mode" : "Edit Mode"}</span>
                    </div>
                  </MenuItem>
                </Menu>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file-input"
                />
              </div>
            </div>
          </div>

          {/* Empty State */}
          {apps.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">
                  No apps configured yet
                </h2>
                <p className="text-muted-foreground mb-6">
                  Get started by adding your first homelab service
                </p>
                <Button
                  onClick={handleAdd}
                  size="lg"
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first app
                </Button>
              </div>
            </div>
          ) : (
            /* Apps Grid */
            <div className="space-y-12">
              {sortedCategories.map((category) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                      {category}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {groupedApps[category].map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        editMode={editMode}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
