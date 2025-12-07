import { Card } from "@/components/ui/card";
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
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Basic Information
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          General details about your application or service
        </p>
      </div>
      <Card className="p-6">
        <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              The name of your app
            </p>
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
        </div>
      </Card>
    </div>
  );
}
