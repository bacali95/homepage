import { Injectable, Logger } from "@nestjs/common";

import type { App } from "../../src/types.js";
import { AppsService } from "../apps/apps.service.js";
import { DatabaseService } from "../database/database.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { compareVersions } from "../tags-fetchers/common.js";
import { DockerhubFetcherService } from "../tags-fetchers/dockerhub-fetcher.service.js";
import { GhcrFetcherService } from "../tags-fetchers/ghcr-fetcher.service.js";
import { GithubReleasesFetcherService } from "../tags-fetchers/github-releases-fetcher.service.js";
import { K8sRegistryFetcherService } from "../tags-fetchers/k8s-registry-fetcher.service.js";

@Injectable()
export class UpdateCheckerService {
  private readonly logger = new Logger(UpdateCheckerService.name);

  constructor(
    private readonly appsService: AppsService,
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
    if (!app.versionPreferences?.enabled) {
      return null;
    }

    const versionExtractionRegex =
      app.versionPreferences.versionExtractionRegex;

    if (app.versionPreferences.sourceType === "DOCKER_HUB") {
      return await this.dockerhubFetcherService.getLatestTag(
        app.versionPreferences.sourceRepo,
        versionExtractionRegex
      );
    } else if (app.versionPreferences.sourceType === "GHCR") {
      return await this.ghcrFetcherService.getLatestTag(
        app.versionPreferences.sourceRepo,
        versionExtractionRegex
      );
    } else if (app.versionPreferences.sourceType === "K8S_REGISTRY") {
      return await this.k8sRegistryFetcherService.getLatestTag(
        app.versionPreferences.sourceRepo,
        versionExtractionRegex
      );
    } else {
      // Default to GitHub Releases
      return await this.githubReleasesFetcherService.getLatestTag(
        app.versionPreferences.sourceRepo,
        versionExtractionRegex
      );
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
    const hadUpdate = app.versionPreferences?.hasUpdate;

    const versionExtractionRegex =
      app.versionPreferences?.versionExtractionRegex;

    if (
      latestVersion &&
      runningVersion &&
      compareVersions(latestVersion, runningVersion, versionExtractionRegex) < 0
    ) {
      await this.databaseService.app.update({
        where: { id: app.id },
        data: {
          versionPreferences: {
            update: {
              latestVersion: latestVersion,
              hasUpdate: true,
            },
          },
        },
      });
      this.logger.log(
        `App ${app.name}: Update available (current: ${runningVersion}, latest: ${latestVersion})`
      );

      // Send notification if this is a newly detected update (wasn't already marked as having update)
      if (!hadUpdate) {
        try {
          // Get the updated app to send notification
          const updatedApp = await this.databaseService.app.findUnique({
            where: { id: app.id },
            include: {
              versionPreferences: true,
              pingPreferences: true,
              appNotificationPreferences: true,
            },
          });
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
      await this.databaseService.appVersionPreference.update({
        where: { appId: app.id },
        data: { latestVersion: latestVersion, hasUpdate: false },
      });
      this.logger.log(
        `App ${app.name}: Already up to date at version ${latestVersion}`
      );
    } else {
      await this.databaseService.appVersionPreference.update({
        where: { appId: app.id },
        data: { latestVersion: null, hasUpdate: false },
      });
      this.logger.log(`App ${app.name}: No latest version found`);
    }
  }

  /**
   * Checks for updates for a single app and updates the database
   */
  private async checkAndUpdateApp(app: App): Promise<void> {
    // Skip apps without version checking enabled
    if (!app.versionPreferences?.enabled) {
      this.logger.log(`Skipping ${app.name}: No version checking enabled`);
      return;
    }

    const runningVersion = await this.appsService.getRunningVersion(
      app.versionPreferences
    );
    if (runningVersion) {
      await this.databaseService.appVersionPreference.update({
        where: { appId: app.id },
        data: { currentVersion: runningVersion },
      });
    }

    const latestVersion = await this.getLatestVersionForApp(app);
    await this.updateAppWithLatestVersion(app, latestVersion, runningVersion);
  }

  async checkForUpdates() {
    const apps = await this.databaseService.app.findMany({
      include: {
        versionPreferences: true,
        pingPreferences: true,
        appNotificationPreferences: true,
      },
    });
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
    const app = await this.databaseService.app.findUnique({
      where: { id: appId },
      include: {
        versionPreferences: true,
        pingPreferences: true,
        appNotificationPreferences: true,
      },
    });
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
