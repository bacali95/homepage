import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { type Release, type SourceType } from "@/lib/api";
import { formatVersion } from "@/lib/utils";

interface FormData {
  name: string;
  url: string;
  repo: string;
  github_repo: string;
  source_type: SourceType;
  current_version: string;
  category: string;
}

interface AppFormProps {
  formData: FormData;
  releases: Release[];
  categories: string[];
  loadingReleases: boolean;
  editingApp: boolean;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSourceTypeChange: (sourceType: SourceType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AppForm({
  formData,
  releases,
  categories,
  loadingReleases,
  editingApp,
  onFormDataChange,
  onSourceTypeChange,
  onSubmit,
  onCancel,
}: AppFormProps) {
  const getRepoLabel = () => {
    switch (formData.source_type) {
      case "dockerhub":
        return "Docker Image";
      case "ghcr":
        return "GitHub Container Registry Image";
      case "k8s":
        return "Kubernetes Registry Image";
      default:
        return "GitHub Repository";
    }
  };

  const getRepoPlaceholder = () => {
    switch (formData.source_type) {
      case "dockerhub":
        return "owner/image or library/image";
      case "ghcr":
        return "owner/repo or owner/repo/image";
      case "k8s":
        return "image-name or owner/image-name";
      default:
        return "owner/repo or https://github.com/owner/repo";
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">App Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          required
          placeholder="My App"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL (optional)</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => onFormDataChange({ url: e.target.value })}
          placeholder="https://app.example.com (leave empty for services without URLs)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category (optional)</Label>
        <Input
          id="category"
          list="category-options"
          value={formData.category}
          onChange={(e) => onFormDataChange({ category: e.target.value })}
          placeholder="e.g., Media, Development, Infrastructure"
        />
        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source_type">Source Type</Label>
        <Select
          id="source_type"
          value={formData.source_type}
          onChange={(e) => onSourceTypeChange(e.target.value as SourceType)}
          required
        >
          <option value="github">GitHub Releases</option>
          <option value="ghcr">GitHub Container Registry</option>
          <option value="dockerhub">Docker Hub</option>
          <option value="k8s">Kubernetes Registry (registry.k8s.io)</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repo">{getRepoLabel()}</Label>
        <Input
          id="repo"
          value={formData.repo || formData.github_repo}
          onChange={(e) => {
            const value = e.target.value;
            onFormDataChange({ repo: value, github_repo: value });
          }}
          required
          placeholder={getRepoPlaceholder()}
        />
        {loadingReleases && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading {formData.source_type === "github" ? "releases" : "tags"}...
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
              onFormDataChange({ current_version: e.target.value })
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
              onFormDataChange({ current_version: e.target.value })
            }
            required
            placeholder="v1.0.0"
          />
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit">{editingApp ? "Update App" : "Add App"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
