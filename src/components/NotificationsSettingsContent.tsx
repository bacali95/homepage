import { useEffect, useState } from "react";
import type { NotificationChannelType } from "generated/client/enums";

import { LoadingState } from "@/components/LoadingState";
import {
  useNotificationChannels,
  useTestNotificationChannel,
  useUpdateNotificationChannel,
} from "@/lib/use-notifications";
import { toast } from "@/lib/use-toast";

import type {
  EmailChannelConfig,
  TelegramChannelConfig,
} from "../../server/notifications/channels/notification-channel.interface";
import { ChannelCard } from "./notification-channels/ChannelCard";

export function NotificationsSettingsContent() {
  const { data: channels = [], isLoading } = useNotificationChannels();
  const updateChannelMutation = useUpdateNotificationChannel();
  const testChannelMutation = useTestNotificationChannel();

  const [configs, setConfigs] = useState<
    Record<string, EmailChannelConfig | TelegramChannelConfig>
  >({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savingChannel, setSavingChannel] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  // Initialize state from channels data
  useEffect(() => {
    if (channels.length > 0) {
      const initialConfigs: Record<
        string,
        EmailChannelConfig | TelegramChannelConfig
      > = {};
      const initialEnabled: Record<string, boolean> = {};

      channels.forEach((channel) => {
        initialConfigs[channel.channelType] = JSON.parse(channel.config);
        initialEnabled[channel.channelType] = channel.enabled;
      });

      setConfigs(initialConfigs);
      setEnabled(initialEnabled);
    }
  }, [channels]);

  const handleConfigChange = (
    channelType: string,
    key: string,
    value: string
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [channelType]: {
        ...prev[channelType],
        [key]: value,
      },
    }));
  };

  const handleEnabledChange = (
    channelType: NotificationChannelType,
    value: boolean
  ) => {
    setEnabled((prev) => ({
      ...prev,
      [channelType]: value,
    }));
  };

  const handleSave = async (channelType: NotificationChannelType) => {
    setSavingChannel(channelType);
    try {
      await updateChannelMutation.mutateAsync({
        channelType,
        enabled: enabled[channelType] || false,
        config: (configs[channelType] || {}) as
          | EmailChannelConfig
          | TelegramChannelConfig,
      });
      toast.success(
        `${channelType} channel updated`,
        "Notification settings saved successfully"
      );
    } catch (error) {
      toast.error(
        "Failed to save settings",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSavingChannel(null);
    }
  };

  const handleTest = async (channelType: NotificationChannelType) => {
    setTestingChannel(channelType);
    try {
      await testChannelMutation.mutateAsync({
        channelType,
        config: configs[channelType] || {},
      });
      toast.success(
        "Test notification sent",
        `Check your ${channelType} to confirm the notification was received.`
      );
    } catch (error) {
      toast.error(
        "Failed to send test notification",
        error instanceof Error
          ? error.message
          : "Please check your configuration."
      );
    } finally {
      setTestingChannel(null);
    }
  };

  const toggleExpanded = (channelType: NotificationChannelType) => {
    setExpanded((prev) => ({
      ...prev,
      [channelType]: !prev[channelType],
    }));
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Notification Settings
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure notification channels for update alerts
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {channels.map((channel) => {
          const channelType = channel.channelType;
          return (
            <ChannelCard
              key={channelType}
              channelType={channelType}
              configured={channel.config !== "{}"}
              config={configs[channelType] || {}}
              enabled={enabled[channelType] || false}
              isExpanded={expanded[channelType] || false}
              onConfigChange={(key, value) =>
                handleConfigChange(channelType, key, value)
              }
              onEnabledChange={(value) =>
                handleEnabledChange(channelType, value)
              }
              onToggleExpanded={() => toggleExpanded(channelType)}
              onSave={() => handleSave(channelType)}
              onTest={() => handleTest(channelType)}
              isSaving={savingChannel === channelType}
              isTesting={testingChannel === channelType}
            />
          );
        })}
      </div>
    </div>
  );
}
