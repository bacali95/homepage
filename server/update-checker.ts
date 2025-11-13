import { dbOperations, type App } from "./db.js";
import { getLatestTag as getGhcrLatestTag } from "./tags-fetchers/ghcr-fetcher.js";
import { getLatestTag as getDockerHubLatestTag } from "./tags-fetchers/dockerhub-fetcher.js";
import { getLatestTag as getK8sLatestTag } from "./tags-fetchers/k8s-registry-fetcher.js";
import { getLatestRelease } from "./tags-fetchers/github-releases-fetcher.js";
import { createLogger } from "./logger.js";

const log = createLogger({ service: "UpdateChecker" });

/**
 * Gets the latest version for an app based on its source type
 */
async function getLatestVersionForApp(app: App): Promise<string | null> {
  if (app.source_type === "dockerhub") {
    return await getDockerHubLatestTag(app.repo);
  } else if (app.source_type === "ghcr") {
    return await getGhcrLatestTag(app.repo);
  } else if (app.source_type === "k8s") {
    return await getK8sLatestTag(app.repo);
  } else {
    // Default to GitHub Releases
    return await getLatestRelease(app.repo);
  }
}

/**
 * Updates an app with the latest version information
 */
function updateAppWithLatestVersion(
  app: App,
  latestVersion: string | null
): void {
  if (latestVersion && latestVersion !== app.current_version) {
    dbOperations.updateApp(app.id, {
      latest_version: latestVersion,
      has_update: true,
    });
    log.info(
      `App ${app.name}: Update available (current: ${app.current_version}, latest: ${latestVersion})`
    );
  } else if (latestVersion) {
    dbOperations.updateApp(app.id, {
      latest_version: latestVersion,
      has_update: false,
    });
    log.info(`App ${app.name}: Already up to date at version ${latestVersion}`);
  } else {
    dbOperations.updateApp(app.id, {
      latest_version: null,
      has_update: false,
    });
    log.info(`App ${app.name}: No latest version found`);
  }
}

/**
 * Checks for updates for a single app and updates the database
 */
async function checkAndUpdateApp(app: App): Promise<void> {
  const latestVersion = await getLatestVersionForApp(app);
  updateAppWithLatestVersion(app, latestVersion);
}

export async function checkForUpdates() {
  const apps = dbOperations.getAllApps();
  let successCount = 0;
  let errorCount = 0;

  log.info(`Starting update check for ${apps.length} app(s)`);

  for (const app of apps) {
    try {
      await checkAndUpdateApp(app);
      successCount++;
    } catch (error) {
      log.error(`Error checking updates for ${app.name}:`, error);
      errorCount++;
    }
  }

  log.info(
    `Update check completed: ${successCount} succeeded, ${errorCount} failed`
  );
}

export async function checkForUpdate(appId: number) {
  const app = dbOperations.getApp(appId);
  if (!app) {
    throw new Error(`App with id ${appId} not found`);
  }

  try {
    await checkAndUpdateApp(app);
    log.info(`Successfully checked for updates for app: ${app.name}`);
  } catch (error) {
    log.error(`Error checking updates for ${app.name}:`, error);
    throw error;
  }
}
