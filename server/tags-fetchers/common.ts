/**
 * Common utilities and types for tags fetchers
 */

// Common tag interface used by all fetchers
export interface Tag {
  name: string;
  last_updated: string;
}

/**
 * Check if a tag matches semantic versioning format
 * Matches: 1.0.0, v1.0.0, 1.2.3-beta, 2.0.0-rc.1, 1.0.0+build.1, etc.
 */
export function isSemver(tag: string): boolean {
  const semverPattern =
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([\w\-]+(?:\.[\w\-]+)*))?(?:\+([\w\-]+(?:\.[\w\-]+)*))?$/i;
  return semverPattern.test(tag);
}

/**
 * Normalize a URL/repository path by removing protocols, trailing slashes, and .git suffix
 */
export function normalizePath(
  path: string,
  replacements: Array<{ pattern: RegExp; replacement: string }> = []
): string {
  let normalized = path
    .replace(/^https?:\/\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  // Apply custom replacements
  for (const { pattern, replacement } of replacements) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized;
}

/**
 * Filter tags to exclude 'latest' and only keep semver-formatted tags
 */
export function filterSemverTags<T extends { name: string }>(tags: T[]): T[] {
  return tags.filter((tag) => tag.name !== "latest" && isSemver(tag.name));
}

/**
 * Compare two semantic version strings
 * Returns: negative if a > b, positive if a < b, 0 if equal
 */
export function compareVersions(a: string, b: string): number {
  // Remove 'v' prefix if present
  const aClean = a.replace(/^v/i, "");
  const bClean = b.replace(/^v/i, "");

  const aParts = aClean.split(/[\.-]/).map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? part : num;
  });
  const bParts = bClean.split(/[\.-]/).map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? part : num;
  });

  const maxLength = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;

    if (typeof aPart === "number" && typeof bPart === "number") {
      if (aPart < bPart) return 1;
      if (aPart > bPart) return -1;
    } else {
      const aStr = String(aPart);
      const bStr = String(bPart);
      if (aStr < bStr) return 1;
      if (aStr > bStr) return -1;
    }
  }

  return 0;
}

/**
 * Get the latest tag from a list of tags
 */
export function getLatestTag<T extends { name: string }>(
  tags: T[]
): string | null {
  return tags.length > 0 ? tags[0].name : null;
}

/**
 * Create GitHub API headers with optional authentication
 */
export function createGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

/**
 * Handle fetch errors with consistent error handling
 */
export async function safeFetch<T>(
  url: string,
  options: RequestInit = {},
  errorContext: string
): Promise<T | null> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(
        `${errorContext}: ${response.statusText} (${response.status})`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Error ${errorContext.toLowerCase()}:`, error);
    return null;
  }
}

/**
 * Configuration for creating a generic tags fetcher
 */
export interface FetcherConfig<TResponse, TTag extends Tag = Tag> {
  /** Name of the fetcher for error messages */
  name: string;
  /** Path normalization replacements */
  pathReplacements?: Array<{ pattern: RegExp; replacement: string }>;
  /** Function to build the API URL from normalized path */
  buildUrl: (normalizedPath: string) => string;
  /** Function to create request headers */
  getHeaders?: () => HeadersInit;
  /** Function to transform API response to Tag array */
  transformResponse: (response: TResponse, originalPath: string) => TTag[];
  /** Optional function to sort tags (default: no sorting) */
  sortTags?: (tags: TTag[]) => TTag[];
  /** Optional function to filter tags (default: filterSemverTags) */
  filterTags?: (tags: TTag[]) => TTag[];
}

/**
 * Generic tags fetcher interface
 */
export interface TagsFetcher {
  /** Fetch all tags */
  fetchTags(source: string): Promise<Tag[]>;
  /** Get the latest tag */
  getLatestTag(source: string): Promise<string | null>;
}

/**
 * Create a generic tags fetcher from configuration
 */
export function createTagsFetcher<TResponse, TTag extends Tag = Tag>(
  config: FetcherConfig<TResponse, TTag>
): TagsFetcher {
  const {
    name,
    pathReplacements = [],
    buildUrl,
    getHeaders,
    transformResponse,
    sortTags,
    filterTags = filterSemverTags,
  } = config;

  async function fetchTags(source: string): Promise<Tag[]> {
    try {
      const normalizedPath = normalizePath(source, pathReplacements);
      const url = buildUrl(normalizedPath);
      const headers = getHeaders?.() || {};

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${name} tags for ${source}: ${response.statusText} (${response.status})`
        );
      }

      const data: TResponse = await response.json();
      let tags = transformResponse(data, source);

      // Apply filtering
      tags = filterTags(tags);

      // Apply sorting if provided
      if (sortTags) {
        tags = sortTags(tags);
      }

      return tags;
    } catch (error) {
      console.error(`Error fetching ${name} tags:`, error);
      return [];
    }
  }

  async function getLatestTag(source: string): Promise<string | null> {
    const tags = await fetchTags(source);
    return tags.length > 0 ? tags[0].name : null;
  }

  return {
    fetchTags,
    getLatestTag,
  };
}
