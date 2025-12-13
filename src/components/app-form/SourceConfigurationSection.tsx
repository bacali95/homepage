import { SourceType } from "generated/client/enums";
import { useFormContext } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { App } from "@/types";

const getRepoLabel = (sourceType: SourceType) => {
  switch (sourceType) {
    case SourceType.DOCKER_HUB:
      return "Docker Image";
    case SourceType.GHCR:
      return "GitHub Container Registry Image";
    case SourceType.K8S_REGISTRY:
      return "Kubernetes Registry Image";
    case SourceType.GITHUB_RELEASES:
      return "GitHub Releases";
    default:
      throw new Error(`Invalid source type: ${sourceType}`);
  }
};

const getRepoPlaceholder = (sourceType: SourceType) => {
  switch (sourceType) {
    case SourceType.DOCKER_HUB:
      return "owner/image or library/image";
    case SourceType.GHCR:
      return "owner/repo or owner/repo/image";
    case SourceType.K8S_REGISTRY:
      return "image-name or owner/image-name";
    case SourceType.GITHUB_RELEASES:
      return "owner/repo or https://github.com/owner/repo";
    default:
      throw new Error(`Invalid source type: ${sourceType}`);
  }
};

export function SourceConfigurationSection() {
  const form = useFormContext<Partial<App>>();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">Source Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Where to check for updates and version information
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source_type" className="flex items-center gap-1">
              Source Type
              <span className="text-destructive">*</span>
            </Label>
            <Select
              id="source_type"
              value={form.watch("versionPreferences.sourceType")}
              onChange={(e) =>
                form.setValue(
                  "versionPreferences.sourceType",
                  e.target.value as SourceType
                )
              }
              required
            >
              <option value={SourceType.GITHUB_RELEASES}>
                GitHub Releases
              </option>
              <option value={SourceType.GHCR}>GitHub Container Registry</option>
              <option value={SourceType.DOCKER_HUB}>Docker Hub</option>
              <option value={SourceType.K8S_REGISTRY}>
                Kubernetes Registry (registry.k8s.io)
              </option>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose where your application releases are published
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo" className="flex items-center gap-1">
              {getRepoLabel(
                form.watch("versionPreferences.sourceType") ??
                  SourceType.GITHUB_RELEASES
              )}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="repo"
              value={form.watch("versionPreferences.sourceRepo")}
              onChange={(e) => {
                form.setValue("versionPreferences.sourceRepo", e.target.value);
              }}
              required
              placeholder={getRepoPlaceholder(
                form.watch("versionPreferences.sourceType") ??
                  SourceType.GITHUB_RELEASES
              )}
            />
            <p className="text-xs text-muted-foreground">
              Repository or image identifier based on the selected source type
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
