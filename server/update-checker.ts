import { dbOperations, type App } from "./db.js";
import { getLatestRelease } from "./github.js";

export async function checkForUpdates() {
  const apps = dbOperations.getAllApps();

  for (const app of apps) {
    try {
      const latestVersion = await getLatestRelease(app.github_repo);

      if (latestVersion && latestVersion !== app.current_version) {
        dbOperations.updateApp(app.id, {
          latest_version: latestVersion,
          has_update: 1,
        });
      } else {
        dbOperations.updateApp(app.id, {
          latest_version: null,
          has_update: 0,
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
