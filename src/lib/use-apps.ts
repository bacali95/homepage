import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { App } from "@/types";

import { api } from "./api";

// Query keys
export const queryKeys = {
  apps: ["apps"] as const,
  categories: ["categories"] as const,
  app: (id: number) => ["apps", id] as const,
};

// Queries
export function useApps() {
  return useQuery({
    queryKey: queryKeys.apps,
    queryFn: () => api.app.getAll({}),
  });
}

export function useApp(id: number) {
  return useQuery({
    queryKey: queryKeys.app(id),
    queryFn: () => api.app.getById({ id }),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.app.getAllCategories({}),
  });
}

// Mutations
export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (app: App) => api.app.create(app),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (app: App) => api.app.update(app),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.app(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.app.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCheckUpdates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.app.checkUpdates({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
    },
  });
}

export function useCheckAppUpdates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.app.checkAppUpdates({ id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.app(id) });
    },
  });
}

export function useFetchVersionFromPod() {
  return useMutation({
    mutationFn: (id: number) => api.app.resolveCurrentVersion({ id }),
  });
}

export function useAppPingStatus(appId: number) {
  return useQuery({
    queryKey: ["ping-status", appId],
    queryFn: () => api.app.getPingStatus({ appId }),
  });
}

export function useAppPingHistory(
  appId: number,
  pageSize: number,
  offset: number
) {
  return useQuery({
    queryKey: ["ping-history", appId],
    queryFn: () => api.app.getPingHistory({ appId, pageSize, offset }),
  });
}
