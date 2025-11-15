import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { type SourceType } from "@/lib/api";
import { type FormSectionProps } from "./types";

interface SourceConfigurationSectionProps extends FormSectionProps {
  onSourceTypeChange: (sourceType: SourceType) => void;
}

const getRepoLabel = (sourceType: SourceType) => {
  switch (sourceType) {
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

const getRepoPlaceholder = (sourceType: SourceType) => {
  switch (sourceType) {
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

export function SourceConfigurationSection({
  formData,
  onFormDataChange,
  onSourceTypeChange,
}: SourceConfigurationSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Source Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Where to check for updates and version information
        </p>
      </div>
      <div className="space-y-4 pl-4 border-l-2 border-border">
        <div className="space-y-2">
          <Label htmlFor="source_type" className="flex items-center gap-1">
            Source Type
            <span className="text-destructive">*</span>
          </Label>
          <Select
            id="source_type"
            value={formData.source_type}
            onChange={(e) => onSourceTypeChange(e.target.value as SourceType)}
            required={formData.enableVersionChecking}
          >
            <option value="github">GitHub Releases</option>
            <option value="ghcr">GitHub Container Registry</option>
            <option value="dockerhub">Docker Hub</option>
            <option value="k8s">Kubernetes Registry (registry.k8s.io)</option>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose where your application releases are published
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repo" className="flex items-center gap-1">
            {getRepoLabel(formData.source_type)}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="repo"
            value={formData.repo}
            onChange={(e) => {
              onFormDataChange({ repo: e.target.value });
            }}
            required={formData.enableVersionChecking}
            placeholder={getRepoPlaceholder(formData.source_type)}
          />
          <p className="text-xs text-muted-foreground">
            Repository or image identifier based on the selected source type
          </p>
        </div>
      </div>
    </div>
  );
}
