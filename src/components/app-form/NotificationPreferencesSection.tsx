import { useEffect, useState } from "react";
import type {
  AppNotificationPreference,
  NotificationChannelType,
} from "generated/client/client";
import { useFormContext, useWatch } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNotificationChannels } from "@/lib/use-notifications";
import type { App } from "@/types";

export function NotificationPreferencesSection() {
  const form = useFormContext<Partial<App>>();
  const preferences = useWatch({
    name: "appNotificationPreferences",
    control: form.control,
    defaultValue: [],
  }) as AppNotificationPreference[];

  const { data: channels = [] } = useNotificationChannels();

  const [localPreferences, setLocalPreferences] = useState<
    Partial<Record<NotificationChannelType, boolean>>
  >({});

  // Initialize local preferences from fetched data
  useEffect(() => {
    if (form.watch("appNotificationPreferences", [])!.length > 0) {
      const prefs: Partial<Record<NotificationChannelType, boolean>> = {};
      preferences.forEach((pref) => {
        prefs[pref.channelType] = pref.enabled;
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPreferences(prefs);
    } else {
      // Default to enabled for all channels if no preferences exist
      const defaultPrefs: Partial<Record<NotificationChannelType, boolean>> =
        {};
      channels.forEach((channel) => {
        defaultPrefs[channel.channelType] = true;
      });
      setLocalPreferences(defaultPrefs);
    }
  }, [preferences, channels, form]);

  const handleToggle = async (
    channelType: NotificationChannelType,
    enabled: boolean
  ) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [channelType]: enabled,
    }));

    const prevPreference = form
      .getValues("appNotificationPreferences")
      ?.find((pref) => pref.channelType === channelType);

    if (prevPreference) {
      form.setValue(
        "appNotificationPreferences",
        preferences.map((pref) =>
          pref.channelType === channelType ? { ...pref, enabled } : pref
        )
      );
    } else {
      form.setValue("appNotificationPreferences", [
        ...(preferences ?? []),
        { appId: form.watch("id") ?? 0, channelType, enabled },
      ]);
    }
  };

  if (channels.length === 0) {
    return null;
  }

  const enabledChannels = channels.filter((ch) => ch.enabled);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Notification Preferences
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Choose which notification channels to use for this app&apos;s update
          alerts
        </p>
      </div>

      {enabledChannels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notification channels are enabled. Configure channels in Settings
          to receive update notifications.
        </p>
      ) : (
        <div className="space-y-2">
          {enabledChannels.map((channel) => (
            <Card key={channel.channelType} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    {channel.channelType.charAt(0).toUpperCase() +
                      channel.channelType.slice(1)}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {channel.config !== "{}"
                      ? "Configured and ready"
                      : "Not configured"}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences[channel.channelType] ?? true}
                    onChange={(e) =>
                      handleToggle(channel.channelType, e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    {(localPreferences[channel.channelType] ?? true)
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </label>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
