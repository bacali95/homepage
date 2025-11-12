export interface GitHubTag {
  name: string;
  last_updated: string;
}

// Check if a tag matches semantic versioning format
function isSemver(tag: string): boolean {
  // Semver pattern: optional 'v' prefix, major.minor.patch, optional pre-release, optional build
  // Matches: 1.0.0, v1.0.0, 1.2.3-beta, 2.0.0-rc.1, 1.0.0+build.1, etc.
  const semverPattern =
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([\w\-]+(?:\.[\w\-]+)*))?(?:\+([\w\-]+(?:\.[\w\-]+)*))?$/i;
  return semverPattern.test(tag);
}

export async function fetchTags(repo: string): Promise<GitHubTag[]> {
  try {
    // Handle different formats:
    // - owner/repo
    // - owner/repo/image
    // - https://github.com/owner/repo
    // - ghcr.io/owner/image
    let imagePath = repo
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/^ghcr\.io\//, "")
      .replace(/^https?:\/\//, "")
      .replace(/\.git$/, "");

    // Remove trailing slashes
    imagePath = imagePath.replace(/\/$/, "");

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

    // Try GitHub Packages API - run both user and org requests in parallel
    try {
      const headers: HeadersInit = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${githubToken}`,
      };

      const response = await fetch(
        `https://api.github.com/users/${owner}/packages/container/${image}/versions`,
        { headers }
      );

      // Check which response has actual data

      if (response.ok) {
        const versions: Array<{
          id: number;
          name: string;
          updated_at: string;
          metadata?: { container?: { tags?: string[] } };
        }> = await response.json();

        // Extract all unique tags from all versions
        const allTags = new Set<string>();
        versions.forEach((version) => {
          version.metadata?.container?.tags?.forEach((tag) => {
            if (tag !== "latest" && isSemver(tag)) {
              allTags.add(tag);
            }
          });
        });

        if (allTags.size > 0) {
          return Array.from(allTags).map((name) => ({
            name,
            last_updated: "",
          }));
        }
        // If no semver tags found, return empty array
        return [];
      } else {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch GitHub Container Registry tags: ${response.statusText} (${response.status}). ${errorText}`
        );
      }
    } catch (apiError: any) {
      // Re-throw the error with more context
      throw apiError;
    }
  } catch (error) {
    console.error("Error fetching GitHub Container Registry tags:", error);
    return [];
  }
}

export async function getLatestTag(repo: string): Promise<string | null> {
  const tags = await fetchTags(repo);
  return tags.length > 0 ? tags[0].name : null;
}

// These functions are for GitHub Container Registry (ghcr.io)
export async function fetchGhcrTags(repo: string): Promise<GitHubTag[]> {
  return fetchTags(repo);
}

export async function getLatestGhcrTag(repo: string): Promise<string | null> {
  return getLatestTag(repo);
}
