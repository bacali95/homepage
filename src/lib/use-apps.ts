import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type App, type SourceType } from "./api";

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
    queryFn: () => api.getApps(),
  });
}

export function useApp(id: number) {
  return useQuery({
    queryKey: queryKeys.app(id),
    queryFn: () => api.getApp(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
  });
}

// Mutations
export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      app: Omit<
        App,
        "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
      >
    ) => api.createApp(app),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      app,
    }: {
      id: number;
      app: Partial<Omit<App, "id" | "created_at" | "updated_at">>;
    }) => api.updateApp(id, app),
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
    mutationFn: (id: number) => api.deleteApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCheckUpdates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.checkUpdates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
    },
  });
}

export function useCheckAppUpdates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.checkAppUpdates(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.app(id) });
    },
  });
}

export function useImportApps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      apps: Omit<
        App,
        "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
      >[]
    ) => api.importApps(apps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useFetchVersionFromPod() {
  return useMutation({
    mutationFn: ({
      dockerImage,
      namespace,
    }: {
      dockerImage: string;
      namespace: string;
    }) => api.fetchVersionFromPod(dockerImage, namespace),
  });
}

export function useFetchReleases() {
  return useMutation({
    mutationFn: ({ source, repo }: { source: SourceType; repo: string }) =>
      api.fetchReleasesBySource(source, repo),
  });
}
