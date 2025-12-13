import { useFormContext } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { App } from "@/types";

export function PingConfigurationSection() {
  const form = useFormContext<Partial<App>>();

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ping Monitoring</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Monitor the availability of your application with periodic HTTP pings
        </p>
      </div>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ping_enabled"
                checked={form.watch("pingPreferences.enabled")}
                onChange={(e) =>
                  form.setValue("pingPreferences.enabled", e.target.checked)
                }
                className="h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
              />
              <Label
                htmlFor="ping_enabled"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable Ping Monitoring
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Enable periodic HTTP pings to monitor if your application is
              accessible
            </p>
          </div>
        </Card>

        {form.watch("pingPreferences.enabled") && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ping_url" className="flex items-center gap-1">
                  Ping URL
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ping_url"
                  type="url"
                  value={form.watch("pingPreferences.url")}
                  onChange={(e) =>
                    form.setValue("pingPreferences.url", e.target.value)
                  }
                  required
                  placeholder="https://app.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  The URL to ping. Can be different from the app URL (e.g., a
                  health check endpoint)
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ping_frequency"
                  className="flex items-center gap-1"
                >
                  Ping Frequency (minutes)
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ping_frequency"
                  type="number"
                  min="1"
                  max="1440"
                  value={form.watch("pingPreferences.frequency")}
                  onChange={(e) =>
                    form.setValue(
                      "pingPreferences.frequency",
                      parseInt(e.target.value)
                    )
                  }
                  required
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">
                  How often to ping the URL (in minutes). Minimum: 1 minute,
                  Maximum: 1440 minutes (24 hours)
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="ping_ignore_ssl"
                  checked={form.watch("pingPreferences.ignoreSsl")}
                  onChange={(e) =>
                    form.setValue("pingPreferences.ignoreSsl", e.target.checked)
                  }
                  className="h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                />
                <Label
                  htmlFor="ping_ignore_ssl"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Ignore SSL Certificate Errors
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Enable this option to ignore SSL certificate validation errors
                when pinging HTTPS URLs. Use with caution in production
                environments.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
