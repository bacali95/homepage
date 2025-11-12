import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Loader2 } from "lucide-react";
import { api, type App, type GitHubRelease } from "@/lib/api";

export default function ManageApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    github_repo: "",
    current_version: "",
  });
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    if (formData.github_repo) {
      const timeoutId = setTimeout(() => {
        loadReleases();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setReleases([]);
    }
  }, [formData.github_repo]);

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

  const loadReleases = async () => {
    if (!formData.github_repo) return;

    setLoadingReleases(true);
    try {
      const fetchedReleases = await api.fetchReleases(formData.github_repo);
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
      if (editingApp) {
        await api.updateApp(editingApp.id, formData);
      } else {
        await api.createApp(formData);
      }

      resetForm();
      await loadApps();
    } catch (error) {
      console.error("Error saving app:", error);
      alert("Error saving app. Please try again.");
    }
  };

  const handleEdit = (app: App) => {
    setEditingApp(app);
    setFormData({
      name: app.name,
      url: app.url,
      github_repo: app.github_repo,
      current_version: app.current_version,
    });
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
    setFormData({
      name: "",
      url: "",
      github_repo: "",
      current_version: "",
    });
    setReleases([]);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Apps</h1>
        {editingApp && (
          <Button variant="outline" onClick={resetForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add New App
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingApp ? "Edit App" : "Add New App"}</CardTitle>
          <CardDescription>
            Configure your homelab service details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">App Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="My App"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
                placeholder="https://app.example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_repo">GitHub Repository</Label>
              <Input
                id="github_repo"
                value={formData.github_repo}
                onChange={(e) =>
                  setFormData({ ...formData, github_repo: e.target.value })
                }
                required
                placeholder="owner/repo or https://github.com/owner/repo"
              />
              {loadingReleases && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading releases...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_version">Current Version</Label>
              {releases.length > 0 ? (
                <Select
                  id="current_version"
                  value={formData.current_version}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_version: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select a version</option>
                  {releases.map((release) => (
                    <option key={release.tag_name} value={release.tag_name}>
                      {release.tag_name} - {release.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id="current_version"
                  value={formData.current_version}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_version: e.target.value,
                    })
                  }
                  required
                  placeholder="v1.0.0"
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingApp ? "Update App" : "Add App"}
              </Button>
              {editingApp && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Configured Apps</h2>
        {apps.length === 0 ? (
          <p className="text-muted-foreground">No apps configured yet.</p>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>
                        {app.url} • {app.github_repo}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(app)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{app.current_version}</Badge>
                    {app.has_update && app.latest_version && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="destructive">
                          v{app.latest_version} available
                        </Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
