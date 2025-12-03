import { Injectable, Logger } from "@nestjs/common";

import { DatabaseService } from "../database/database.service.js";
import { PodsService } from "../pods/pods.service.js";
import { isVersionsDifferent } from "../tags-fetchers/common.js";

@Injectable()
export class K8sPodUpdaterService {
  private readonly logger = new Logger(K8sPodUpdaterService.name);

  constructor(
    private readonly podsService: PodsService,
    private readonly databaseService: DatabaseService
  ) {}

  /**
   * Get all apps that have docker_image set and update their current_version
   */
  async updateVersionsFromPods() {
    const apps = this.databaseService.getAllApps();

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const app of apps) {
      if (!app.docker_image || !app.k8s_namespace) {
        skippedCount++;
        continue;
      }

      try {
        const version = await this.podsService.getVersionFromPod(
          app.docker_image,
          app.k8s_namespace
        );
        if (
          version &&
          app.current_version &&
          isVersionsDifferent(version, app.current_version)
        ) {
          this.databaseService.updateApp(app.id, {
            current_version: version,
          });
          this.logger.log(
            `Updated ${app.name} version from ${app.current_version} to ${version}`
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
}
