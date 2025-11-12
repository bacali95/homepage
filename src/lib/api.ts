const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type SourceType = "github" | "ghcr" | "dockerhub";

export interface App {
  id: number;
  name: string;
  url: string;
  github_repo: string; // Keep for backward compatibility
  repo: string;
  source_type: SourceType;
  current_version: string;
  latest_version: string | null;
  has_update: boolean;
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

export const api = {
  getApps: async (): Promise<App[]> => {
    const response = await fetch(`${API_BASE}/apps`);
    if (!response.ok) {
      throw new Error("Failed to fetch apps");
    }
    return response.json();
  },

  getApp: async (id: number): Promise<App> => {
    const response = await fetch(`${API_BASE}/apps/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch app");
    }
    return response.json();
  },

  createApp: async (
    app: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >
  ): Promise<{ id: number }> => {
    const response = await fetch(`${API_BASE}/apps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(app),
    });
    if (!response.ok) {
      throw new Error("Failed to create app");
    }
    return response.json();
  },

  updateApp: async (
    id: number,
    app: Partial<Omit<App, "id" | "created_at" | "updated_at">>
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/apps/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(app),
    });
    if (!response.ok) {
      throw new Error("Failed to update app");
    }
  },

  deleteApp: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/apps/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete app");
    }
  },

  fetchReleasesBySource: async (
    source: SourceType,
    repo: string
  ): Promise<Release[]> => {
    const response = await fetch(
      `${API_BASE}/releases?source=${source}&repo=${encodeURIComponent(repo)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch releases");
    }
    return response.json();
  },

  checkUpdates: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/check-updates`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to check updates");
    }
  },
};
