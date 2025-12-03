import { Injectable, Logger } from "@nestjs/common";

import { App, DatabaseService } from "../database/database.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { PodsService } from "../pods/pods.service.js";
import { isVersionsDifferent } from "../tags-fetchers/common.js";
import { DockerhubFetcherService } from "../tags-fetchers/dockerhub-fetcher.service.js";
import { GhcrFetcherService } from "../tags-fetchers/ghcr-fetcher.service.js";
import { GithubReleasesFetcherService } from "../tags-fetchers/github-releases-fetcher.service.js";
import { K8sRegistryFetcherService } from "../tags-fetchers/k8s-registry-fetcher.service.js";

@Injectable()
export class UpdateCheckerService {
  private readonly logger = new Logger(UpdateCheckerService.name);

  constructor(
    private readonly podsService: PodsService,
    private readonly databaseService: DatabaseService,
    private readonly ghcrFetcherService: GhcrFetcherService,
    private readonly dockerhubFetcherService: DockerhubFetcherService,
    private readonly k8sRegistryFetcherService: K8sRegistryFetcherService,
    private readonly githubReleasesFetcherService: GithubReleasesFetcherService,
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * Gets the latest version for an app based on its source type
   */
  private async getLatestVersionForApp(app: App): Promise<string | null> {
    if (!app.repo || !app.source_type) {
      return null;
    }

    if (app.source_type === "dockerhub") {
      return await this.dockerhubFetcherService.getLatestTag(app.repo);
    } else if (app.source_type === "ghcr") {
      return await this.ghcrFetcherService.getLatestTag(app.repo);
    } else if (app.source_type === "k8s") {
      return await this.k8sRegistryFetcherService.getLatestTag(app.repo);
    } else {
      // Default to GitHub Releases
      return await this.githubReleasesFetcherService.getLatestTag(app.repo);
    }
  }

  /**
   * Updates an app with the latest version information
   */
  private async updateAppWithLatestVersion(
    app: App,
    latestVersion: string | null,
    runningVersion: string | null
  ): Promise<void> {
    const hadUpdate = app.has_update;

    if (
      latestVersion &&
      runningVersion &&
      isVersionsDifferent(latestVersion, runningVersion)
    ) {
      this.databaseService.updateApp(app.id, {
        latest_version: latestVersion,
        has_update: true,
      });
      this.logger.log(
        `App ${app.name}: Update available (current: ${runningVersion}, latest: ${latestVersion})`
      );

      // Send notification if this is a newly detected update (wasn't already marked as having update)
      if (!hadUpdate) {
        try {
          // Get the updated app to send notification
          const updatedApp = this.databaseService.getApp(app.id);
          if (updatedApp) {
            await this.notificationsService.notifyAppUpdate(updatedApp);
          }
        } catch (error) {
          // Log error but don't fail the update check
          this.logger.error(
            `Failed to send notification for ${app.name}:`,
            error
          );
        }
      }
    } else if (latestVersion) {
      this.databaseService.updateApp(app.id, {
        latest_version: latestVersion,
        has_update: false,
      });
      this.logger.log(
        `App ${app.name}: Already up to date at version ${latestVersion}`
      );
    } else {
      this.databaseService.updateApp(app.id, {
        latest_version: null,
        has_update: false,
      });
      this.logger.log(`App ${app.name}: No latest version found`);
    }
  }

  /**
   * Checks for updates for a single app and updates the database
   */
  private async checkAndUpdateApp(app: App): Promise<void> {
    // Skip apps without version checking enabled
    if (
      !app.repo ||
      !app.source_type ||
      !app.docker_image ||
      !app.k8s_namespace
    ) {
      this.logger.log(`Skipping ${app.name}: No version checking enabled`);
      return;
    }

    const runningVersion = await this.podsService.getVersionFromPod(
      app.docker_image,
      app.k8s_namespace
    );
    if (
      runningVersion &&
      app.current_version &&
      isVersionsDifferent(runningVersion, app.current_version)
    ) {
      this.databaseService.updateApp(app.id, {
        current_version: runningVersion,
      });
    }

    const latestVersion = await this.getLatestVersionForApp(app);
    await this.updateAppWithLatestVersion(app, latestVersion, runningVersion);
  }

  async checkForUpdates() {
    const apps = this.databaseService.getAllApps();
    let successCount = 0;
    let errorCount = 0;

    this.logger.log(`Starting update check for ${apps.length} app(s)`);

    for (const app of apps) {
      try {
        await this.checkAndUpdateApp(app);
        successCount++;
      } catch (error) {
        this.logger.error(`Error checking updates for ${app.name}:`, error);
        errorCount++;
      }
    }

    this.logger.log(
      `Update check completed: ${successCount} succeeded, ${errorCount} failed`
    );
  }

  async checkForUpdate(appId: number) {
    const app = this.databaseService.getApp(appId);
    if (!app) {
      throw new Error(`App with id ${appId} not found`);
    }

    try {
      await this.checkAndUpdateApp(app);
      this.logger.log(`Successfully checked for updates for app: ${app.name}`);
    } catch (error) {
      this.logger.error(`Error checking updates for ${app.name}:`, error);
      throw error;
    }
  }
}
