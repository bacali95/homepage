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
import { api, type App, type Release, type SourceType } from "@/lib/api";

const formatVersion = (version: string): string => {
  return version.startsWith("v") ? version : `v${version}`;
};

export default function ManageApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    repo: "",
    github_repo: "",
    source_type: "github" as SourceType,
    current_version: "",
  });
  const [releases, setReleases] = useState<Release[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

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

  const loadReleases = async () => {
    const repo = formData.repo || formData.github_repo;
    if (!repo) return;

    setLoadingReleases(true);
    try {
      let fetchedReleases: Release[] = await api.fetchReleasesBySource(
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
    // Migrate old 'github' to 'ghcr' if needed, but default to 'github' for releases
    const sourceType = app.source_type || "github";
    setFormData({
      name: app.name,
      url: app.url,
      repo: app.repo || app.github_repo,
      github_repo: app.github_repo || app.repo,
      source_type: sourceType,
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
      repo: "",
      github_repo: "",
      source_type: "github",
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
              <Label htmlFor="source_type">Source Type</Label>
              <Select
                id="source_type"
                value={formData.source_type}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    source_type: e.target.value as SourceType,
                    repo: "",
                    github_repo: "",
                    current_version: "",
                  });
                  setReleases([]);
                }}
                required
              >
                <option value="github">GitHub Releases</option>
                <option value="ghcr">GitHub Container Registry</option>
                <option value="dockerhub">Docker Hub</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo">
                {formData.source_type === "dockerhub"
                  ? "Docker Image"
                  : formData.source_type === "ghcr"
                  ? "GitHub Container Registry Image"
                  : "GitHub Repository"}
              </Label>
              <Input
                id="repo"
                value={formData.repo || formData.github_repo}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    repo: value,
                    github_repo: value,
                  });
                }}
                required
                placeholder={
                  formData.source_type === "dockerhub"
                    ? "owner/image or library/image"
                    : formData.source_type === "ghcr"
                    ? "owner/repo or owner/repo/image"
                    : "owner/repo or https://github.com/owner/repo"
                }
              />
              {loadingReleases && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading{" "}
                  {formData.source_type === "github" ? "releases" : "tags"}...
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
                  {releases.map((release) => {
                    const version =
                      "tag_name" in release ? release.tag_name : release.name;
                    return (
                      <option key={version} value={version}>
                        {formatVersion(version)}
                      </option>
                    );
                  })}
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
                        {app.url} • {app.repo || app.github_repo} (
                        {app.source_type === "ghcr"
                          ? "GHCR"
                          : app.source_type === "dockerhub"
                          ? "Docker Hub"
                          : "GitHub Releases"}
                        )
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
                    <Badge variant="outline">
                      {formatVersion(app.current_version)}
                    </Badge>
                    {app.has_update && app.latest_version && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="destructive">
                          {formatVersion(app.latest_version)} available
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
