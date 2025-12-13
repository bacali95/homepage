import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { App } from "@/types";

export function VersionManagementSection() {
  const form = useFormContext<Partial<App>>();
  const runningConfig = useWatch({
    name: "versionPreferences.runningConfig",
    control: form.control,
    defaultValue: "{}",
  }) as string;

  const getRunningConfigValue = useCallback(
    (key: string) => {
      const parsedRunningConfig = JSON.parse(runningConfig) as Record<
        string,
        string
      >;

      return parsedRunningConfig[key];
    },
    [runningConfig]
  );

  const updateRunningConfig = (key: string, value: string) => {
    const runningConfig = JSON.parse(
      form.watch("versionPreferences.runningConfig") || "{}"
    ) as Record<string, string>;

    runningConfig[key] = value;

    form.setValue(
      "versionPreferences.runningConfig",
      JSON.stringify(runningConfig)
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">Version Management</h3>
          <p className="text-sm text-muted-foreground">
            Track and update the current version of your application
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="docker_image" className="flex items-center gap-1">
              Docker Image
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="docker_image"
              value={getRunningConfigValue("dockerImage") || ""}
              onChange={(e) =>
                updateRunningConfig("dockerImage", e.target.value)
              }
              required={form.watch("versionPreferences.enabled")}
              placeholder="nginx:1.21.0 or ghcr.io/owner/repo:v1.0.0"
            />
            <p className="text-xs text-muted-foreground">
              Used to fetch the current running version from Kubernetes pods
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="k8s_namespace" className="flex items-center gap-1">
              Kubernetes Namespace
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="k8s_namespace"
              value={getRunningConfigValue("k8sNamespace") || ""}
              onChange={(e) =>
                updateRunningConfig("k8sNamespace", e.target.value)
              }
              required={form.watch("versionPreferences.enabled")}
              placeholder="default"
            />
            <p className="text-xs text-muted-foreground">
              Specify the namespace to search for the pod
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
