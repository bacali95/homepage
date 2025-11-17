import { Injectable } from "@nestjs/common";
import {
  createGitHubHeaders,
  compareVersions,
  createTagsFetcher,
} from "./common.js";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

@Injectable()
export class GithubReleasesFetcherService {
  private readonly fetcher = createTagsFetcher<GitHubRelease[]>({
    name: "GitHub Releases",
    pathReplacements: [
      { pattern: /^https?:\/\/github\.com\//, replacement: "" },
    ],
    buildUrl: (normalizedPath) =>
      `https://api.github.com/repos/${normalizedPath}/releases`,
    getHeaders: () => createGitHubHeaders(),
    transformResponse: (releases, originalPath) => {
      // Filter out prereleases
      return releases
        .filter((r) => !r.prerelease)
        .map((release) => ({
          name: release.tag_name,
          last_updated: release.published_at,
        }));
    },
  });

  getLatestTag(repo: string): Promise<string | null> {
    return this.fetcher(repo);
  }
}
