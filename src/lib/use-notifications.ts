import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationChannelType } from "../../generated/client/enums";
import type {
  EmailChannelConfig,
  TelegramChannelConfig,
} from "../../server/notifications/channels/notification-channel.interface";
import { api } from "./api";

const queryKeys = {
  notificationChannels: ["notifications", "channels"] as const,
  appNotificationPreferences: (appId: number) =>
    ["notifications", "apps", appId, "preferences"] as const,
};

export function useNotificationChannels() {
  return useQuery({
    queryKey: queryKeys.notificationChannels,
    queryFn: () => api.notificationChannel.getAll({}),
  });
}

export function useUpdateNotificationChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelType,
      enabled,
      config,
    }: {
      channelType: NotificationChannelType;
      enabled: boolean;
      config: EmailChannelConfig | TelegramChannelConfig;
    }) =>
      api.notificationChannel.update({
        channelType,
        enabled,
        config: JSON.stringify(config),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationChannels,
      });
    },
  });
}

export function useTestNotificationChannel() {
  return useMutation({
    mutationFn: ({
      channelType,
      config,
    }: {
      channelType: NotificationChannelType;
      config: EmailChannelConfig | TelegramChannelConfig;
    }) => api.notificationChannel.test({ channelType, config }),
  });
}
