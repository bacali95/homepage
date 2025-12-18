import { Injectable, Logger } from "@nestjs/common";

import type { AppVersionPreference } from "../../generated/client/client.js";
import { DatabaseService } from "../database/database.service.js";
import { compareVersions } from "../tags-fetchers/common.js";
import { K8sPodsService } from "./k8s-pods.service.js";

@Injectable()
export class AppsService {
  private readonly logger = new Logger(AppsService.name);

  constructor(
    private readonly k8sPodsService: K8sPodsService,
    private readonly databaseService: DatabaseService
  ) {}

  /**
   * Get all apps that have docker_image set and update their current_version
   */
  async updateVersionsFromPods() {
    const apps = await this.databaseService.app.findMany({
      include: {
        versionPreferences: true,
      },
    });

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const app of apps) {
      if (!app.versionPreferences?.enabled) {
        skippedCount++;
        continue;
      }

      try {
        const version = await this.getRunningVersion(app.versionPreferences);
        if (
          version &&
          compareVersions(
            version,
            app.versionPreferences.currentVersion ?? "",
            app.versionPreferences.versionExtractionRegex
          ) != 0
        ) {
          await this.databaseService.appVersionPreference.update({
            where: { appId: app.id },
            data: { currentVersion: version },
          });
          this.logger.log(
            `Updated ${app.name} version from ${app.versionPreferences.currentVersion ?? "unknown"} to ${version}`
          );
          updatedCount++;
        } else if (version) {
          this.logger.log(
            `App ${app.name} is already at version ${version}, no update needed`
          );
        }
        processedCount++;
      } catch (error) {
        this.logger.error(
          `Error updating version from pod for ${app.name}:`,
          error
        );
      }
    }

    this.logger.log(
      `K8s pod version update completed: ${processedCount} processed, ${updatedCount} updated, ${skippedCount} skipped`
    );
  }

  async getRunningVersion(versionPreferences: AppVersionPreference) {
    switch (versionPreferences.runningEnvironment) {
      case "KUBERNETES": {
        const { dockerImage, k8sNamespace } = JSON.parse(
          versionPreferences.runningConfig
        ) as { dockerImage: string; k8sNamespace: string };

        return await this.k8sPodsService.getVersionFromPod(
          dockerImage,
          k8sNamespace
        );
      }
      default: {
        throw new Error(
          `Unsupported running environment: ${versionPreferences.runningEnvironment}`
        );
      }
    }
  }
}
