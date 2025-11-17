import { Injectable } from "@nestjs/common";
import {
  createGitHubHeaders,
  compareVersions,
  createTagsFetcher,
} from "./common.js";

interface GhcrVersion {
  id: number;
  name: string;
  updated_at: string;
  metadata?: { container?: { tags?: string[] } };
}

@Injectable()
export class GhcrFetcherService {
  private readonly fetcher = createTagsFetcher<GhcrVersion[]>({
    name: "GitHub Container Registry",
    pathReplacements: [
      { pattern: /^https?:\/\/github\.com\//, replacement: "" },
      { pattern: /^ghcr\.io\//, replacement: "" },
    ],
    buildUrl: (normalizedPath) => {
      // For GitHub Container Registry, the image name is typically the repo name
      // Format: owner/repo or owner/repo/image
      const parts = normalizedPath.split("/");
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

      return `https://api.github.com/users/${owner}/packages/container/${image}/versions`;
    },
    getHeaders: () => {
      const githubToken = process.env.GITHUB_TOKEN;

      if (!githubToken) {
        throw new Error(
          "GITHUB_TOKEN is required to fetch GitHub Container Registry tags. Please set it in your .env file."
        );
      }

      return createGitHubHeaders();
    },
    transformResponse: (versions, originalPath) => {
      // Extract all unique tags from all versions
      const allTags = new Set<string>();
      versions.forEach((version) => {
        version.metadata?.container?.tags?.forEach((tag) => {
          allTags.add(tag);
        });
      });

      return Array.from(allTags).map((name) => ({
        name,
        last_updated: "",
      }));
    },
  });

  getLatestTag(repo: string): Promise<string | null> {
    return this.fetcher(repo);
  }
}
