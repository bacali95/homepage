import { useFormContext } from "react-hook-form";

import { SuggestField, TextField } from "@/components/form-fields";
import { SectionCard } from "@/components/primitives";
import { useCategories } from "@/lib/use-apps";
import type { App } from "@/types";

export function BasicInformationSection() {
  const form = useFormContext<Partial<App>>();
  const { data: categories = [] } = useCategories();
  const dirty = { shouldDirty: true };

  return (
    <SectionCard
      title="Basic information"
      description="General details about your application or service"
    >
      <TextField
        label="App name"
        required
        value={form.watch("name") ?? ""}
        onValueChange={(value) => form.setValue("name", value, dirty)}
        placeholder="My App"
        description="The name of your app"
      />
      <SuggestField
        label="Category"
        required
        value={form.watch("category") ?? ""}
        onValueChange={(value) => form.setValue("category", value, dirty)}
        suggestions={categories}
        placeholder="e.g. Media, Development, Infrastructure"
        description="Group your apps by category for better organization"
      />
      <TextField
        label="App URL"
        type="url"
        value={form.watch("url") ?? ""}
        onValueChange={(value) => form.setValue("url", value, dirty)}
        placeholder="https://app.example.com"
        description="Optional. The web address where your service is accessible. Leave empty for services without a URL."
      />
      <TextField
        label="Icon URL"
        type="url"
        value={form.watch("icon") ?? ""}
        onValueChange={(value) => form.setValue("icon", value, dirty)}
        placeholder="https://example.com/icon.png"
        description="Optional. URL to an icon image for this app."
      />
    </SectionCard>
  );
}
