import { dbOperations, type App } from "./db.js";
import { getLatestTag as getGhcrLatestTag } from "./github.js";
import { getLatestTag as getDockerHubLatestTag } from "./dockerhub.js";
import { getLatestRelease } from "./github-releases.js";

export async function checkForUpdates() {
  const apps = dbOperations.getAllApps();

  for (const app of apps) {
    try {
      let latestVersion: string | null = null;

      if (app.source_type === "dockerhub") {
        latestVersion = await getDockerHubLatestTag(app.repo);
      } else if (app.source_type === "ghcr") {
        latestVersion = await getGhcrLatestTag(app.repo || app.github_repo);
      } else {
        // Default to GitHub Releases
        latestVersion = await getLatestRelease(app.repo || app.github_repo);
      }

      if (latestVersion && latestVersion !== app.current_version) {
        dbOperations.updateApp(app.id, {
          latest_version: latestVersion,
          has_update: true,
        });
      } else {
        dbOperations.updateApp(app.id, {
          latest_version: null,
          has_update: false,
        });
      }
    } catch (error) {
      console.error(`Error checking updates for ${app.name}:`, error);
    }
  }
}

// Run update check every 6 hours
export function startUpdateChecker() {
  // Run immediately
  checkForUpdates();

  // Then run every 6 hours
  setInterval(() => {
    checkForUpdates();
  }, 6 * 60 * 60 * 1000);
}
