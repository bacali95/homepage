import { Button } from "@/components/ui/button";
import { type SourceType } from "@/lib/api";

import { BasicInformationSection } from "./app-form/BasicInformationSection";
import { NotificationPreferencesSection } from "./app-form/NotificationPreferencesSection";
import { PingConfigurationSection } from "./app-form/PingConfigurationSection";
import { SourceConfigurationSection } from "./app-form/SourceConfigurationSection";
import { type FormData } from "./app-form/types";
import { VersionManagementSection } from "./app-form/VersionManagementSection";

interface AppFormProps {
  formData: FormData;
  categories: string[];
  editingApp: boolean;
  editingAppId?: number | null;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSourceTypeChange: (sourceType: SourceType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AppForm({
  formData,
  categories,
  editingApp,
  editingAppId,
  onFormDataChange,
  onSourceTypeChange,
  onSubmit,
  onCancel,
}: AppFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <BasicInformationSection
        formData={formData}
        categories={categories}
        onFormDataChange={onFormDataChange}
      />

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

      <PingConfigurationSection
        formData={formData}
        onFormDataChange={onFormDataChange}
      />

      {editingApp && editingAppId && (
        <NotificationPreferencesSection appId={editingAppId} />
      )}

      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit">{editingApp ? "Update App" : "Add App"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export type { FormData };
