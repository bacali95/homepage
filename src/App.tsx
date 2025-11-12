import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Plus, Settings, RefreshCw } from "lucide-react";
import { api, type App, type Release, type SourceType } from "@/lib/api";
import { groupAppsByCategory, sortCategories } from "@/lib/utils";
import { AppCard } from "@/components/AppCard";
import { AppForm } from "@/components/AppForm";
import { ThemeToggle } from "@/components/ThemeToggle";

interface FormData {
  name: string;
  url: string;
  repo: string;
  github_repo: string;
  source_type: SourceType;
  current_version: string;
  category: string;
}

const initialFormData: FormData = {
  name: "",
  url: "",
  repo: "",
  github_repo: "",
  source_type: "github",
  current_version: "",
  category: "",
};

export default function App() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  // Load initial data
  useEffect(() => {
    loadApps();
    loadCategories();
  }, []);

  // Load releases when repo changes
  useEffect(() => {
    if (formData.repo || formData.github_repo) {
      const timeoutId = setTimeout(() => {
        loadReleases();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setReleases([]);
    }
  }, [formData.repo, formData.github_repo, formData.source_type]);

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

  const loadReleases = async () => {
    const repo = formData.repo || formData.github_repo;
    if (!repo) return;

    setLoadingReleases(true);
    try {
      const fetchedReleases: Release[] = await api.fetchReleasesBySource(
        formData.source_type,
        repo
      );
      setReleases(fetchedReleases);
    } catch (error) {
      console.error("Error loading releases:", error);
      setReleases([]);
    } finally {
      setLoadingReleases(false);
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
    setReleases([]);
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
    });
    setReleases([]);
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
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <ThemeToggle />
                <Button
                  onClick={handleCheckUpdates}
                  variant="outline"
                  disabled={checkingUpdates}
                  className="flex-1 sm:flex-initial shadow-sm hover:shadow-md transition-shadow"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      checkingUpdates ? "animate-spin" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {checkingUpdates ? "Checking..." : "Check Updates"}
                  </span>
                  <span className="sm:hidden">
                    {checkingUpdates ? "Checking..." : "Check"}
                  </span>
                </Button>
                <Button
                  onClick={handleAdd}
                  className="flex-1 sm:flex-initial shadow-sm hover:shadow-md transition-shadow"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add App</span>
                  <span className="sm:hidden">Add</span>
                </Button>
                <Button
                  variant={editMode ? "default" : "outline"}
                  onClick={() => setEditMode(!editMode)}
                  className="flex-1 sm:flex-initial shadow-sm hover:shadow-md transition-shadow"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {editMode ? "Exit Edit Mode" : "Edit Mode"}
                  </span>
                  <span className="sm:hidden">Edit</span>
                </Button>
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
              releases={releases}
              categories={categories}
              loadingReleases={loadingReleases}
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
