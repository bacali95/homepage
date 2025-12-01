import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type FormSectionProps } from "./types";

interface BasicInformationSectionProps extends FormSectionProps {
  categories: string[];
}

export function BasicInformationSection({
  formData,
  categories,
  onFormDataChange,
}: BasicInformationSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Basic Information</h3>
        <p className="text-sm text-muted-foreground">
          General details about your application or service
        </p>
      </div>
      <div className="space-y-4 pl-4 border-l-2 border-border">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-1">
            App Name
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
            required
            placeholder="My App"
          />
          <p className="text-xs text-muted-foreground">The name of your app</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-1">
            Category
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="category"
            list="category-options"
            value={formData.category}
            onChange={(e) => onFormDataChange({ category: e.target.value })}
            required
            placeholder="e.g., Media, Development, Infrastructure"
          />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground">
            Group your apps by category for better organization
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => onFormDataChange({ url: e.target.value })}
            placeholder="https://app.example.com (leave empty for services without URLs)"
          />
          <p className="text-xs text-muted-foreground">
            Optional: The web address where your service is accessible
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Icon URL</Label>
          <Input
            id="icon"
            type="url"
            value={formData.icon}
            onChange={(e) => onFormDataChange({ icon: e.target.value })}
            placeholder="https://example.com/icon.png"
          />
          <p className="text-xs text-muted-foreground">
            Optional: URL to an icon image for this app
          </p>
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
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
            Enable this to configure version tracking and update checking (e.g.,
            GitHub, Docker Hub, Kubernetes). Leave disabled for apps not managed
            through version tracking (e.g., NAS, router).
          </p>
        </div>
      </div>
    </div>
  );
}
