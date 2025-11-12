const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type SourceType = "github" | "ghcr" | "dockerhub" | "k8s";

export interface App {
  id: number;
  name: string;
  url: string | null;
  github_repo: string; // Keep for backward compatibility
  repo: string;
  source_type: SourceType;
  current_version: string;
  latest_version: string | null;
  has_update: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
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

  getCategories: (): Promise<string[]> =>
    http.get<string[]>("/categories", "Failed to fetch categories"),
};
