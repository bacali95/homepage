import { useFormContext, useWatch } from "react-hook-form";

import { TextField } from "@/components/form-fields";
import { SectionCard } from "@/components/primitives";
import { parseRunningConfig } from "@/lib/utils";
import type { App } from "@/types";

export function VersionManagementSection() {
  const form = useFormContext<Partial<App>>();
  const runningConfig = useWatch({
    name: "versionPreferences.runningConfig",
    control: form.control,
    defaultValue: "{}",
  }) as string;
  const parsed = parseRunningConfig(runningConfig) as Record<string, string>;

  const updateRunningConfig = (key: string, value: string) => {
    const current = parseRunningConfig(
      form.getValues("versionPreferences.runningConfig")
    ) as Record<string, string>;

    form.setValue(
      "versionPreferences.runningConfig",
      JSON.stringify({ ...current, [key]: value }),
      { shouldDirty: true }
    );
  };

  return (
    <SectionCard
      title="Version management"
      description="Track and update the current version of your application"
    >
      <TextField
        label="Docker image"
        required
        mono
        value={parsed.dockerImage ?? ""}
        onValueChange={(value) => updateRunningConfig("dockerImage", value)}
        placeholder="nginx:1.21.0 or ghcr.io/owner/repo:v1.0.0"
        description="Used to fetch the current running version from Kubernetes pods"
      />
      <TextField
        label="Kubernetes namespace"
        required
        mono
        value={parsed.k8sNamespace ?? ""}
        onValueChange={(value) => updateRunningConfig("k8sNamespace", value)}
        placeholder="default"
        description="The namespace to search for the pod"
      />
      <TextField
        label="Version extraction regex (optional)"
        mono
        value={form.watch("versionPreferences.versionExtractionRegex") ?? ""}
        onValueChange={(value) =>
          form.setValue(
            "versionPreferences.versionExtractionRegex",
            value || null,
            { shouldDirty: true }
          )
        }
        placeholder="(\d+)\.(\d+)\.(\d+)-beta\.(\d+)"
        description={
          <>
            Custom pattern to extract version numbers for comparison. Use
            capture groups, for example{" "}
            <code>(\d+)\.(\d+)\.(\d+)-beta\.(\d+)</code> for versions like
            v4.0.0-beta.455. Don&apos;t include forward slashes. Leave empty to
            use the default extraction.
          </>
        }
      />
    </SectionCard>
  );
}
