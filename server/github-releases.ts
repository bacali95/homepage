export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
}

export async function fetchReleases(repo: string): Promise<GitHubRelease[]> {
  try {
    // Remove 'https://github.com/' if present
    const repoPath = repo
      .replace(/^https?:\/\/github\.com\//, "")
      .replace(/\.git$/, "");
    const url = `https://api.github.com/repos/${repoPath}/releases`;

    const githubToken = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch releases: ${response.statusText}`);
    }

    const releases = await response.json();
    return releases.filter((r: GitHubRelease) => !r.prerelease).slice(0, 50); // Get latest 50 non-prerelease releases
  } catch (error) {
    console.error("Error fetching GitHub releases:", error);
    return [];
  }
}

export async function getLatestRelease(repo: string): Promise<string | null> {
  const releases = await fetchReleases(repo);
  return releases.length > 0 ? releases[0].tag_name : null;
}
