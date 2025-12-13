import { useFormContext } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/lib/use-apps";
import type { App } from "@/types";

export function BasicInformationSection() {
  const form = useFormContext<Partial<App>>();
  const { data: categories = [] } = useCategories();

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
              value={form.watch("name")}
              onChange={(e) => form.setValue("name", e.target.value)}
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
              value={form.watch("category")}
              onChange={(e) => form.setValue("category", e.target.value)}
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
              value={form.watch("url") ?? ""}
              onChange={(e) => form.setValue("url", e.target.value)}
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
              value={form.watch("icon") ?? ""}
              onChange={(e) => form.setValue("icon", e.target.value)}
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
