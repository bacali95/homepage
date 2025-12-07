import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { type SourceType } from "@/lib/api";

import { SourceConfigurationSection } from "./SourceConfigurationSection";
import { type FormData } from "./types";
import { VersionManagementSection } from "./VersionManagementSection";

interface VersionCheckingSectionProps {
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSourceTypeChange: (sourceType: SourceType) => void;
}

export function VersionCheckingSection({
  formData,
  onFormDataChange,
  onSourceTypeChange,
}: VersionCheckingSectionProps) {
  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Version Checking
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure version tracking and update checking
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableVersionChecking"
                checked={formData.enableVersionChecking}
                onChange={(e) =>
                  onFormDataChange({
                    enableVersionChecking: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
              />
              <Label
                htmlFor="enableVersionChecking"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable Version Checking
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Enable this to configure version tracking and update checking
              (e.g., GitHub, Docker Hub, Kubernetes). Leave disabled for apps
              not managed through version tracking (e.g., NAS, router).
            </p>
          </div>
        </Card>

        {formData.enableVersionChecking && (
          <>
            <SourceConfigurationSection
              formData={formData}
              onFormDataChange={onFormDataChange}
              onSourceTypeChange={onSourceTypeChange}
            />
            <VersionManagementSection
              formData={formData}
              onFormDataChange={onFormDataChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
