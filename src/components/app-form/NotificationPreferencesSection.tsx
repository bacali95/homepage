import { useFormContext, useWatch } from "react-hook-form";

import { SwitchField } from "@/components/form-fields";
import { SectionCard } from "@/components/primitives";
import { useNotificationChannels } from "@/lib/use-notifications";
import type { App } from "@/types";

import type {
  AppNotificationPreference,
  NotificationChannelType,
} from "../../../generated/client/client";
import { CHANNEL_CONFIGS } from "../notification-channels/config";

export function NotificationPreferencesSection() {
  const form = useFormContext<Partial<App>>();
  const preferences = (useWatch({
    name: "appNotificationPreferences",
    control: form.control,
    defaultValue: [],
  }) ?? []) as AppNotificationPreference[];

  const { data: channels = [] } = useNotificationChannels();

  const isEnabled = (channelType: NotificationChannelType) =>
    preferences.find((pref) => pref.channelType === channelType)?.enabled ??
    true;

  const handleToggle = (
    channelType: NotificationChannelType,
    enabled: boolean
  ) => {
    const exists = preferences.some((pref) => pref.channelType === channelType);
    form.setValue(
      "appNotificationPreferences",
      exists
        ? preferences.map((pref) =>
            pref.channelType === channelType ? { ...pref, enabled } : pref
          )
        : [
            ...preferences,
            { appId: form.getValues("id") ?? 0, channelType, enabled },
          ],
      { shouldDirty: true }
    );
  };

  if (channels.length === 0) {
    return null;
  }

  const enabledChannels = channels.filter((channel) => channel.enabled);

  return (
    <SectionCard
      title="Notification preferences"
      description="Choose which notification channels to use for this app's update alerts"
    >
      {enabledChannels.length === 0 ? (
        <p className="text-sm text-muted">
          No notification channels are enabled. Configure channels in Settings
          to receive update notifications.
        </p>
      ) : (
        enabledChannels.map((channel) => (
          <SwitchField
            key={channel.channelType}
            label={CHANNEL_CONFIGS[channel.channelType].label}
            description={
              channel.config !== "{}"
                ? "Configured and ready"
                : "Not configured"
            }
            checked={isEnabled(channel.channelType)}
            onCheckedChange={(checked) =>
              handleToggle(channel.channelType, checked)
            }
          />
        ))
      )}
    </SectionCard>
  );
}
