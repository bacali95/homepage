const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type SourceType = "github" | "ghcr" | "dockerhub" | "k8s";

export interface App {
  id: number;
  name: string;
  url: string | null;
  repo: string | null;
  source_type: SourceType | null;
  current_version: string | null;
  latest_version: string | null;
  has_update: boolean;
  category: string;
  docker_image: string | null;
  k8s_namespace: string | null;
  icon: string | null;
  ping_enabled: boolean;
  ping_url: string | null;
  ping_frequency: number | null;
  created_at: string;
  updated_at: string;
}

export interface PingStatus {
  status: boolean | null;
  latest: {
    status: boolean;
    response_time: number | null;
    status_code: number | null;
    error_message: string | null;
    created_at: string;
  } | null;
}

export interface PingHistoryEntry {
  id: number;
  status: boolean;
  response_time: number | null;
  status_code: number | null;
  error_message: string | null;
  created_at: string;
}

export interface PingHistoryResponse {
  data: PingHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

export interface GitHubTag {
  name: string;
  last_updated: string;
}

export interface DockerHubTag {
  name: string;
  last_updated: string;
}

export type Release = GitHubRelease | GitHubTag | DockerHubTag;

// Reusable request configuration
interface RequestOptions extends RequestInit {
  errorMessage?: string;
  parseResponse?: boolean;
}

// Reusable request handler
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    errorMessage,
    parseResponse = true,
    headers = {},
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  const response = await fetch(url, {
    ...fetchOptions,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    const message =
      errorMessage || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!parseResponse) {
    return undefined as T;
  }

  return response.json();
}

// Reusable HTTP method helpers
const http = {
  get: <T>(endpoint: string, errorMessage?: string): Promise<T> =>
    request<T>(endpoint, { method: "GET", errorMessage }),

  post: <T>(
    endpoint: string,
    body?: unknown,
    errorMessage?: string
  ): Promise<T> =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      errorMessage,
    }),

  put: <T>(
    endpoint: string,
    body?: unknown,
    errorMessage?: string
  ): Promise<T> =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      errorMessage,
    }),

  delete: (endpoint: string, errorMessage?: string): Promise<void> =>
    request<void>(endpoint, {
      method: "DELETE",
      parseResponse: false,
      errorMessage,
    }),
};

export const api = {
  getApps: (): Promise<App[]> =>
    http.get<App[]>("/apps", "Failed to fetch apps"),

  getApp: (id: number): Promise<App> =>
    http.get<App>(`/apps/${id}`, "Failed to fetch app"),

  createApp: (
    app: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >
  ): Promise<{ id: number }> =>
    http.post<{ id: number }>("/apps", app, "Failed to create app"),

  updateApp: (
    id: number,
    app: Partial<Omit<App, "id" | "created_at" | "updated_at">>
  ): Promise<void> =>
    http.put<void>(`/apps/${id}`, app, "Failed to update app"),

  deleteApp: (id: number): Promise<void> =>
    http.delete(`/apps/${id}`, "Failed to delete app"),

  fetchReleasesBySource: (
    source: SourceType,
    repo: string
  ): Promise<Release[]> => {
    const endpoint = `/releases?source=${source}&repo=${encodeURIComponent(
      repo
    )}`;
    return http.get<Release[]>(endpoint, "Failed to fetch releases");
  },

  checkUpdates: (): Promise<void> =>
    http.post<void>("/check-updates", undefined, "Failed to check updates"),

  checkAppUpdates: (id: number): Promise<void> =>
    http.post<void>(
      `/check-updates/${id}`,
      undefined,
      "Failed to check updates for app"
    ),

  getCategories: (): Promise<string[]> =>
    http.get<string[]>("/categories", "Failed to fetch categories"),

  fetchVersionFromPod: (
    dockerImage: string,
    namespace: string
  ): Promise<{ version: string | null }> => {
    const params = new URLSearchParams({ dockerImage, namespace });
    return http.get<{ version: string | null }>(
      `/fetch-pod-version?${params.toString()}`,
      "Failed to fetch version from pod"
    );
  },

  exportApps: (): Promise<App[]> =>
    http.get<App[]>("/apps", "Failed to export apps"),

  importApps: (
    apps: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >[]
  ): Promise<{
    success: boolean;
    imported: number;
    created: number;
    updated: number;
    errors?: string[];
  }> =>
    http.post<{
      success: boolean;
      imported: number;
      created: number;
      updated: number;
      errors?: string[];
    }>("/apps/import", apps, "Failed to import apps"),

  // Notification APIs
  getNotificationChannels: (): Promise<
    Array<{
      channel_type: string;
      enabled: boolean;
      configured: boolean;
      config: Record<string, any>;
    }>
  > =>
    http.get<
      Array<{
        channel_type: string;
        enabled: boolean;
        configured: boolean;
        config: Record<string, any>;
      }>
    >("/notifications/channels", "Failed to fetch notification channels"),

  updateNotificationChannel: (
    channelType: string,
    data: { enabled: boolean; config: Record<string, any> }
  ): Promise<{ success: boolean }> =>
    http.put<{ success: boolean }>(
      `/notifications/channels/${channelType}`,
      data,
      "Failed to update notification channel"
    ),

  getAppNotificationPreferences: (
    appId: number
  ): Promise<Array<{ channel_type: string; enabled: boolean }>> =>
    http.get<Array<{ channel_type: string; enabled: boolean }>>(
      `/notifications/apps/${appId}/preferences`,
      "Failed to fetch app notification preferences"
    ),

  setAppNotificationPreference: (
    appId: number,
    data: { channel_type: string; enabled: boolean }
  ): Promise<{ success: boolean }> =>
    http.post<{ success: boolean }>(
      `/notifications/apps/${appId}/preferences`,
      data,
      "Failed to set app notification preference"
    ),

  testNotificationChannel: (
    channelType: string,
    config: Record<string, any>
  ): Promise<{ success: boolean; message: string }> =>
    http.post<{ success: boolean; message: string }>(
      `/notifications/channels/${channelType}/test`,
      { config },
      "Failed to send test notification"
    ),

  // Ping APIs
  getPingStatus: (id: number): Promise<PingStatus> =>
    http.get<PingStatus>(`/ping/${id}/status`, "Failed to fetch ping status"),

  getPingHistory: (
    id: number,
    limit?: number,
    offset?: number
  ): Promise<PingHistoryResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const queryString = params.toString();
    return http.get<PingHistoryResponse>(
      `/ping/${id}/history${queryString ? `?${queryString}` : ""}`,
      "Failed to fetch ping history"
    );
  },
};
