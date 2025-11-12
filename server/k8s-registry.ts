export interface K8sRegistryTag {
  name: string;
  last_updated: string;
}

export interface K8sRegistryResponse {
  name: string;
  tags: string[];
}

// Check if a tag matches semantic versioning format
function isSemver(tag: string): boolean {
  // Semver pattern: optional 'v' prefix, major.minor.patch, optional pre-release, optional build
  // Matches: 1.0.0, v1.0.0, 1.2.3-beta, 2.0.0-rc.1, 1.0.0+build.1, etc.
  const semverPattern =
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([\w\-]+(?:\.[\w\-]+)*))?(?:\+([\w\-]+(?:\.[\w\-]+)*))?$/i;
  return semverPattern.test(tag);
}

// Compare two semantic version strings
function compareVersions(a: string, b: string): number {
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

export async function fetchTags(image: string): Promise<K8sRegistryTag[]> {
  try {
    // Handle different formats:
    // - image-name
    // - owner/image-name
    // - registry.k8s.io/owner/image-name
    // - https://registry.k8s.io/owner/image-name
    let imagePath = image
      .replace(/^https?:\/\/registry\.k8s\.io\//, "")
      .replace(/^registry\.k8s\.io\//, "")
      .replace(/^https?:\/\//, "")
      .replace(/\.git$/, "");

    // Remove trailing slashes
    imagePath = imagePath.replace(/\/$/, "");

    const url = `https://registry.k8s.io/v2/${imagePath}/tags/list`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Kubernetes registry tags: ${response.statusText}`
      );
    }

    const data: K8sRegistryResponse = await response.json();

    // Filter out 'latest' and only keep semver-formatted tags, then sort by version
    const filteredTags = data.tags
      .filter((tag) => tag !== "latest" && isSemver(tag))
      .sort(compareVersions)
      .map((name) => ({
        name,
        last_updated: "",
      }));

    return filteredTags;
  } catch (error) {
    console.error("Error fetching Kubernetes registry tags:", error);
    return [];
  }
}

export async function getLatestTag(image: string): Promise<string | null> {
  const tags = await fetchTags(image);
  return tags.length > 0 ? tags[0].name : null;
}
