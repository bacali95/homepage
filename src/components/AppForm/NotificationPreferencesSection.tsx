import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  useNotificationChannels,
  useAppNotificationPreferences,
  useSetAppNotificationPreference,
} from "@/lib/use-notifications";
import { Bell } from "lucide-react";

interface NotificationPreferencesSectionProps {
  appId: number | null;
}

export function NotificationPreferencesSection({
  appId,
}: NotificationPreferencesSectionProps) {
  const { data: channels = [] } = useNotificationChannels();
  const { data: preferences = [] } = useAppNotificationPreferences(appId || 0);
  const setPreferenceMutation = useSetAppNotificationPreference();

  const [localPreferences, setLocalPreferences] = useState<
    Record<string, boolean>
  >({});

  // Initialize local preferences from fetched data
  useEffect(() => {
    if (preferences.length > 0) {
      const prefs: Record<string, boolean> = {};
      preferences.forEach((pref) => {
        prefs[pref.channel_type] = pref.enabled;
      });
      setLocalPreferences(prefs);
    } else {
      // Default to enabled for all channels if no preferences exist
      const defaultPrefs: Record<string, boolean> = {};
      channels.forEach((channel) => {
        defaultPrefs[channel.channel_type] = true;
      });
      setLocalPreferences(defaultPrefs);
    }
  }, [preferences, channels]);

  const handleToggle = async (channelType: string, enabled: boolean) => {
    if (!appId) return;

    setLocalPreferences((prev) => ({
      ...prev,
      [channelType]: enabled,
    }));

    try {
      await setPreferenceMutation.mutateAsync({
        appId,
        channelType,
        enabled,
      });
    } catch (error) {
      // Revert on error
      setLocalPreferences((prev) => ({
        ...prev,
        [channelType]: !enabled,
      }));
      console.error("Failed to update notification preference:", error);
    }
  };

  if (!appId || channels.length === 0) {
    return null;
  }

  const enabledChannels = channels.filter((ch) => ch.enabled);

  if (enabledChannels.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Notification Preferences</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No notification channels are enabled. Configure channels in Settings
          to receive update notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Choose which notification channels to use for this app's update alerts.
      </p>
      <div className="space-y-2">
        {enabledChannels.map((channel) => (
          <Card key={channel.channel_type} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  {channel.channel_type.charAt(0).toUpperCase() +
                    channel.channel_type.slice(1)}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {channel.configured
                    ? "Configured and ready"
                    : "Not configured"}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences[channel.channel_type] ?? true}
                  onChange={(e) =>
                    handleToggle(channel.channel_type, e.target.checked)
                  }
                  disabled={setPreferenceMutation.isPending}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  {localPreferences[channel.channel_type] ?? true
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
