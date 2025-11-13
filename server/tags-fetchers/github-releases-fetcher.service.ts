import { Injectable, Logger } from "@nestjs/common";
import { normalizePath, createGitHubHeaders } from "./common.js";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

@Injectable()
export class GithubReleasesFetcherService {
  private readonly logger = new Logger(GithubReleasesFetcherService.name);

  async fetchReleases(repo: string): Promise<GitHubRelease[]> {
    try {
      // Remove 'https://github.com/' if present
      const repoPath = normalizePath(repo, [
        { pattern: /^https?:\/\/github\.com\//, replacement: "" },
      ]);
      const url = `https://api.github.com/repos/${repoPath}/releases`;

      const headers = createGitHubHeaders();

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`);
      }

      const releases: GitHubRelease[] = await response.json();
      return releases.filter((r) => !r.prerelease).slice(0, 50); // Get latest 50 non-prerelease releases
    } catch (error) {
      this.logger.error(
        `Error fetching GitHub releases: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return [];
    }
  }

  async getLatestRelease(repo: string): Promise<string | null> {
    const releases = await this.fetchReleases(repo);
    return releases.length > 0 ? releases[0].tag_name : null;
  }
}
