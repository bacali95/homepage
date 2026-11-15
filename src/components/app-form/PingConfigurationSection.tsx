import { useFormContext } from "react-hook-form";

import { NumberField, SwitchField, TextField } from "@/components/form-fields";
import { SectionCard } from "@/components/primitives";
import type { App } from "@/types";

export function PingConfigurationSection() {
  const form = useFormContext<Partial<App>>();
  const dirty = { shouldDirty: true };
  const enabled = form.watch("pingPreferences.enabled") ?? false;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Ping monitoring"
        description="Monitor the availability of your application with periodic HTTP pings"
      >
        <SwitchField
          label="Enable ping monitoring"
          description="Send periodic HTTP requests to check that your application is reachable."
          checked={enabled}
          onCheckedChange={(checked) =>
            form.setValue("pingPreferences.enabled", checked, dirty)
          }
        />
      </SectionCard>

      {enabled && (
        <SectionCard
          title="Ping settings"
          description="What to ping, and how often"
        >
          <TextField
            label="Ping URL"
            type="url"
            required
            value={form.watch("pingPreferences.url") ?? ""}
            onValueChange={(value) =>
              form.setValue("pingPreferences.url", value, dirty)
            }
            placeholder="https://app.example.com"
            description="The URL to ping. It can differ from the app URL, for example a health check endpoint."
          />
          <NumberField
            label="Ping frequency (minutes)"
            required
            min={1}
            max={1440}
            value={form.watch("pingPreferences.frequency") ?? null}
            onValueChange={(value) =>
              form.setValue("pingPreferences.frequency", value ?? 1, dirty)
            }
            description="How often to ping the URL. Between 1 minute and 1440 minutes (24 hours)."
          />
          <SwitchField
            label="Ignore SSL certificate errors"
            description="Skip certificate validation when pinging HTTPS URLs. Use with caution."
            checked={form.watch("pingPreferences.ignoreSsl") ?? false}
            onCheckedChange={(checked) =>
              form.setValue("pingPreferences.ignoreSsl", checked, dirty)
            }
          />
        </SectionCard>
      )}
    </div>
  );
}
