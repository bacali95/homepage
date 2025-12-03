import { Injectable } from "@nestjs/common";

import {
  createGitHubHeaders,
  createTagsFetcher,
  extractSemverFromTag,
} from "./common.js";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

@Injectable()
export class GithubReleasesFetcherService {
  private readonly fetcher = createTagsFetcher<GitHubRelease>({
    name: "GitHub Releases",
    pathReplacements: [
      { pattern: /^https?:\/\/github\.com\//, replacement: "" },
    ],
    buildUrl: (normalizedPath) =>
      `https://api.github.com/repos/${normalizedPath}/releases/latest`,
    getHeaders: () => createGitHubHeaders(),
    transformResponse: (release) => [extractSemverFromTag(release.tag_name)],
  });

  getLatestTag(repo: string): Promise<string | null> {
    return this.fetcher(repo);
  }
}
