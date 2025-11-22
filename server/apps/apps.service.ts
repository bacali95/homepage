import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";
import { UpdateCheckerService } from "../updates/update-checker.service.js";

@Injectable()
export class AppsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly updateCheckerService: UpdateCheckerService
  ) {}

  getAllApps() {
    return this.databaseService.getAllApps();
  }

  getApp(id: number) {
    return this.databaseService.getApp(id);
  }

  getAppByName(name: string) {
    return this.databaseService.getAppByName(name);
  }

  createApp(
    app: Omit<
      import("../database/database.service.js").App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >
  ) {
    return this.databaseService.createApp(app);
  }

  async updateApp(
    id: number,
    app: Partial<
      Omit<
        import("../database/database.service.js").App,
        "id" | "created_at" | "updated_at"
      >
    >
  ) {
    // Check if current_version is being updated
    const existingApp = this.databaseService.getApp(id);
    const isVersionUpdate =
      existingApp &&
      app.current_version &&
      app.current_version !== existingApp.current_version;

    this.databaseService.updateApp(id, app);

    // If version was updated, check for updates for this app instantly
    if (isVersionUpdate) {
      try {
        await this.updateCheckerService.checkForUpdate(id);
      } catch (error) {
        // Log error but don't fail the update request
        // Error will be logged by the update checker service
      }
    }

    return { success: true };
  }

  deleteApp(id: number) {
    const app = this.databaseService.getApp(id);
    this.databaseService.deleteApp(id);
    return { success: true, app };
  }

  async importApps(apps: any[]) {
    const errors: string[] = [];
    let imported = 0;
    let created = 0;
    let updated = 0;

    for (const app of apps) {
      try {
        const {
          name,
          url,
          repo,
          source_type,
          current_version,
          category,
          docker_image,
          k8s_namespace,
          icon,
        } = app;

        if (!name) {
          errors.push(`App "unknown": Missing required field (name)`);
          continue;
        }
        if (typeof category !== "string" || category.trim() === "") {
          errors.push(
            `App "${
              name || "unknown"
            }": category is required and must be a non-empty string`
          );
          continue;
        }

        // Check if app with same name already exists
        const existingApp = this.databaseService.getAppByName(name);

        if (existingApp) {
          // Update existing app
          const isVersionUpdate =
            current_version && current_version !== existingApp.current_version;

          this.databaseService.updateApp(existingApp.id, {
            name,
            url: url || null,
            repo: repo || null,
            source_type: source_type || null,
            current_version: current_version || null,
            category,
            docker_image: docker_image || null,
            k8s_namespace: k8s_namespace || null,
            icon: icon || null,
          });

          // If version was updated, check for updates for this app instantly
          if (isVersionUpdate) {
            try {
              await this.updateCheckerService.checkForUpdate(existingApp.id);
            } catch (error) {
              // Log error but don't fail the import
              // Error will be logged by the update checker service
            }
          }

          updated++;
        } else {
          // Create new app
          this.databaseService.createApp({
            name,
            url: url || null,
            repo: repo || null,
            source_type: source_type || null,
            current_version: current_version || null,
            category,
            docker_image: docker_image || null,
            k8s_namespace: k8s_namespace || null,
            icon: icon || null,
          });
          created++;
        }
        imported++;
      } catch (error) {
        const appName = app.name || "unknown";
        errors.push(
          `App "${appName}": ${
            error instanceof Error ? error.message : "Failed to import"
          }`
        );
      }
    }

    return {
      success: true,
      imported,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
