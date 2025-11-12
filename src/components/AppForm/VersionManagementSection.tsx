import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useState } from "react";
import { type FormSectionProps } from "./types";

export function VersionManagementSection({
  formData,
  onFormDataChange,
}: FormSectionProps) {
  const [fetchingVersion, setFetchingVersion] = useState(false);

  const handleFetchVersionFromPod = async () => {
    if (!formData.docker_image) {
      alert("Please enter a Docker image first");
      return;
    }

    if (!formData.k8s_namespace) {
      alert("Please enter a Kubernetes namespace first");
      return;
    }

    setFetchingVersion(true);
    try {
      const result = await api.fetchVersionFromPod(
        formData.docker_image,
        formData.k8s_namespace
      );
      if (result.version) {
        onFormDataChange({ current_version: result.version });
      } else {
        alert(
          "Could not find version from running pod. Make sure the pod is running and the image matches."
        );
      }
    } catch (error) {
      console.error("Error fetching version from pod:", error);
      alert(
        "Failed to fetch version from pod. Make sure kubectl is configured and the pod is running."
      );
    } finally {
      setFetchingVersion(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Version Management</h3>
        <p className="text-sm text-muted-foreground">
          Track and update the current version of your application
        </p>
      </div>
      <div className="space-y-4 pl-4 border-l-2 border-border">
        <div className="space-y-2">
          <Label htmlFor="docker_image" className="flex items-center gap-1">
            Docker Image
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="docker_image"
            value={formData.docker_image || ""}
            onChange={(e) => onFormDataChange({ docker_image: e.target.value })}
            required
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
            value={formData.k8s_namespace || ""}
            onChange={(e) =>
              onFormDataChange({ k8s_namespace: e.target.value })
            }
            required
            placeholder="default"
          />
          <p className="text-xs text-muted-foreground">
            Specify the namespace to search for the pod
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_version" className="flex items-center gap-1">
            Current Version
            <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="current_version"
              value={formData.current_version}
              readOnly={!!(formData.docker_image && formData.k8s_namespace)}
              onChange={(e) => {
                if (!(formData.docker_image && formData.k8s_namespace)) {
                  onFormDataChange({ current_version: e.target.value });
                }
              }}
              required
              placeholder={
                formData.docker_image && formData.k8s_namespace
                  ? "Will be filled by fetching from pod"
                  : "Enter version manually (e.g., v1.0.0)"
              }
              className={
                formData.docker_image && formData.k8s_namespace
                  ? "bg-muted cursor-not-allowed flex-1"
                  : "flex-1"
              }
            />
            {formData.docker_image && formData.k8s_namespace && (
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchVersionFromPod}
                disabled={fetchingVersion}
                className="h-10"
              >
                {fetchingVersion ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Fetch from Pod
              </Button>
            )}
          </div>
          {formData.docker_image && formData.k8s_namespace ? (
            <p className="text-xs text-muted-foreground">
              Use "Fetch from Pod" button to automatically fill this field
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Enter the current version manually, or fill Docker image and
              namespace above to fetch from pod
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
