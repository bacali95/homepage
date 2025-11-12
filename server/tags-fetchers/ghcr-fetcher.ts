import {
  type Tag,
  createTagsFetcher,
  normalizePath,
  createGitHubHeaders,
  isSemver,
} from "./common.js";

interface GhcrVersion {
  id: number;
  name: string;
  updated_at: string;
  metadata?: { container?: { tags?: string[] } };
}

// GHCR requires custom logic for path parsing and response transformation
async function fetchGhcrTagsInternal(repo: string): Promise<Tag[]> {
  try {
    // Handle different formats:
    // - owner/repo
    // - owner/repo/image
    // - https://github.com/owner/repo
    // - ghcr.io/owner/image
    const imagePath = normalizePath(repo, [
      { pattern: /^https?:\/\/github\.com\//, replacement: "" },
      { pattern: /^ghcr\.io\//, replacement: "" },
    ]);

    // For GitHub Container Registry, the image name is typically the repo name
    // Format: owner/repo or owner/repo/image
    const parts = imagePath.split("/");
    let owner: string;
    let image: string;

    if (parts.length === 2) {
      // owner/repo - use repo as image name
      [owner, image] = parts;
    } else if (parts.length === 3) {
      // owner/repo/image
      [owner, , image] = parts;
    } else {
      throw new Error("Invalid repository format");
    }

    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      throw new Error(
        "GITHUB_TOKEN is required to fetch GitHub Container Registry tags. Please set it in your .env file."
      );
    }

    const headers = createGitHubHeaders();
    const response = await fetch(
      `https://api.github.com/users/${owner}/packages/container/${image}/versions`,
      { headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch GitHub Container Registry tags: ${response.statusText} (${response.status}). ${errorText}`
      );
    }

    const versions: GhcrVersion[] = await response.json();

    // Extract all unique tags from all versions
    const allTags = new Set<string>();
    versions.forEach((version) => {
      version.metadata?.container?.tags?.forEach((tag) => {
        if (tag !== "latest" && isSemver(tag)) {
          allTags.add(tag);
        }
      });
    });

    return Array.from(allTags).map((name) => ({
      name,
      last_updated: "",
    }));
  } catch (error) {
    console.error("Error fetching GitHub Container Registry tags:", error);
    return [];
  }
}

// Create a custom fetcher wrapper for GHCR since it needs special handling
const ghcrFetcher: {
  fetchTags: (repo: string) => Promise<Tag[]>;
  getLatestTag: (repo: string) => Promise<string | null>;
} = {
  fetchTags: fetchGhcrTagsInternal,
  getLatestTag: async (repo: string) => {
    const tags = await fetchGhcrTagsInternal(repo);
    return tags.length > 0 ? tags[0].name : null;
  },
};

export const fetchTags = ghcrFetcher.fetchTags;
export const getLatestTag = ghcrFetcher.getLatestTag;
