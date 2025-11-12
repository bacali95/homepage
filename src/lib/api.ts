const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface App {
  id: number;
  name: string;
  url: string;
  github_repo: string;
  current_version: string;
  latest_version: string | null;
  has_update: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

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

  fetchReleases: async (repo: string): Promise<GitHubRelease[]> => {
    const response = await fetch(
      `${API_BASE}/github/releases?repo=${encodeURIComponent(repo)}`
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
