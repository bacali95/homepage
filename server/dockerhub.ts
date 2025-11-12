export interface DockerHubTag {
  name: string;
  last_updated: string;
}

export interface DockerHubResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DockerHubTag[];
}

// Check if a tag matches semantic versioning format
function isSemver(tag: string): boolean {
  // Semver pattern: optional 'v' prefix, major.minor.patch, optional pre-release, optional build
  // Matches: 1.0.0, v1.0.0, 1.2.3-beta, 2.0.0-rc.1, 1.0.0+build.1, etc.
  const semverPattern =
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([\w\-]+(?:\.[\w\-]+)*))?(?:\+([\w\-]+(?:\.[\w\-]+)*))?$/i;
  return semverPattern.test(tag);
}

export async function fetchTags(image: string): Promise<DockerHubTag[]> {
  try {
    // Handle different formats:
    // - owner/image
    // - docker.io/owner/image
    // - https://hub.docker.com/r/owner/image
    let imagePath = image
      .replace(/^https?:\/\/hub\.docker\.com\/r\//, "")
      .replace(/^docker\.io\//, "")
      .replace(/^https?:\/\//, "")
      .replace(/\.git$/, "");

    // Remove trailing slashes
    imagePath = imagePath.replace(/\/$/, "");

    const url = `https://hub.docker.com/v2/repositories/${imagePath}/tags?page_size=100`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Docker Hub tags: ${response.statusText}`
      );
    }

    const data: DockerHubResponse = await response.json();

    // Filter out 'latest' and only keep semver-formatted tags
    return data.results.filter(
      (tag) => tag.name !== "latest" && isSemver(tag.name)
    );
  } catch (error) {
    console.error("Error fetching Docker Hub tags:", error);
    return [];
  }
}

export async function getLatestTag(image: string): Promise<string | null> {
  const tags = await fetchTags(image);
  return tags.length > 0 ? tags[0].name : null;
}
