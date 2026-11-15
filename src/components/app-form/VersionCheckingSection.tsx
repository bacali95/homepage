import { useFormContext } from "react-hook-form";

import { SwitchField } from "@/components/form-fields";
import { SectionCard } from "@/components/primitives";
import type { App } from "@/types";

import { SourceConfigurationSection } from "./SourceConfigurationSection";
import { VersionManagementSection } from "./VersionManagementSection";

export function VersionCheckingSection() {
  const form = useFormContext<Partial<App>>();
  const enabled = form.watch("versionPreferences.enabled") ?? false;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Version checking"
        description="Configure version tracking and update checking"
      >
        <SwitchField
          label="Enable version checking"
          description="Track the running version against GitHub, Docker Hub or Kubernetes registries. Leave disabled for apps that aren't version tracked, like a NAS or router."
          checked={enabled}
          onCheckedChange={(checked) =>
            form.setValue("versionPreferences.enabled", checked, {
              shouldDirty: true,
            })
          }
        />
      </SectionCard>

      {enabled && (
        <>
          <SourceConfigurationSection />
          <VersionManagementSection />
        </>
      )}
    </div>
  );
}
