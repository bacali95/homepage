import { Button } from "@/components/ui/button";
import { type SourceType } from "@/lib/api";
import { BasicInformationSection } from "./AppForm/BasicInformationSection";
import { SourceConfigurationSection } from "./AppForm/SourceConfigurationSection";
import { VersionManagementSection } from "./AppForm/VersionManagementSection";
import { type FormData } from "./AppForm/types";

interface AppFormProps {
  formData: FormData;
  categories: string[];
  editingApp: boolean;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSourceTypeChange: (sourceType: SourceType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AppForm({
  formData,
  categories,
  editingApp,
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

      <SourceConfigurationSection
        formData={formData}
        onFormDataChange={onFormDataChange}
        onSourceTypeChange={onSourceTypeChange}
      />

      <VersionManagementSection
        formData={formData}
        onFormDataChange={onFormDataChange}
      />

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
