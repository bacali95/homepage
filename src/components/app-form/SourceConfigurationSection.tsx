import { useFormContext } from "react-hook-form";

import { SelectField, TextField } from "@/components/form-fields";
import { SectionCard } from "@/components/primitives";
import type { App } from "@/types";

import { SourceType } from "../../../generated/client/enums";

const getRepoLabel = (sourceType: SourceType) => {
  switch (sourceType) {
    case SourceType.DOCKER_HUB:
      return "Docker image";
    case SourceType.GHCR:
      return "GitHub Container Registry image";
    case SourceType.K8S_REGISTRY:
      return "Kubernetes registry image";
    case SourceType.GITHUB_RELEASES:
      return "GitHub releases";
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

const sourceOptions = [
  { value: SourceType.GITHUB_RELEASES, label: "GitHub Releases" },
  { value: SourceType.GHCR, label: "GitHub Container Registry" },
  { value: SourceType.DOCKER_HUB, label: "Docker Hub" },
  {
    value: SourceType.K8S_REGISTRY,
    label: "Kubernetes Registry (registry.k8s.io)",
  },
];

export function SourceConfigurationSection() {
  const form = useFormContext<Partial<App>>();
  const dirty = { shouldDirty: true };
  const sourceType =
    form.watch("versionPreferences.sourceType") ?? SourceType.GITHUB_RELEASES;

  return (
    <SectionCard
      title="Source configuration"
      description="Where to check for updates and version information"
    >
      <SelectField
        label="Source type"
        required
        value={sourceType}
        onValueChange={(value) =>
          form.setValue(
            "versionPreferences.sourceType",
            value as SourceType,
            dirty
          )
        }
        options={sourceOptions}
        description="Choose where your application releases are published"
      />
      <TextField
        label={getRepoLabel(sourceType)}
        required
        mono
        value={form.watch("versionPreferences.sourceRepo") ?? ""}
        onValueChange={(value) =>
          form.setValue("versionPreferences.sourceRepo", value, dirty)
        }
        placeholder={getRepoPlaceholder(sourceType)}
        description="Repository or image identifier based on the selected source type"
      />
    </SectionCard>
  );
}
