import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

const queryKeys = {
  notificationChannels: ["notifications", "channels"] as const,
  appNotificationPreferences: (appId: number) =>
    ["notifications", "apps", appId, "preferences"] as const,
};

export function useNotificationChannels() {
  return useQuery({
    queryKey: queryKeys.notificationChannels,
    queryFn: () => api.getNotificationChannels(),
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
      channelType: string;
      enabled: boolean;
      config: Record<string, any>;
    }) => api.updateNotificationChannel(channelType, { enabled, config }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationChannels,
      });
    },
  });
}

export function useAppNotificationPreferences(appId: number) {
  return useQuery({
    queryKey: queryKeys.appNotificationPreferences(appId),
    queryFn: () => api.getAppNotificationPreferences(appId),
    enabled: !!appId,
  });
}

export function useSetAppNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appId,
      channelType,
      enabled,
    }: {
      appId: number;
      channelType: string;
      enabled: boolean;
    }) =>
      api.setAppNotificationPreference(appId, {
        channel_type: channelType,
        enabled,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appNotificationPreferences(variables.appId),
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
      channelType: string;
      config: Record<string, any>;
    }) => api.testNotificationChannel(channelType, config),
  });
}
