import { Router } from "express";
import { dbOperations } from "../db.js";
import { checkForUpdate } from "../update-checker.js";
import { createLogger } from "../logger.js";

const log = createLogger({ route: "/api/apps" });
const router = Router();

router.get("/", (_req, res) => {
  try {
    const apps = dbOperations.getAllApps();
    res.json(apps);
  } catch (error) {
    log.error("Error fetching apps:", error);
    res.status(500).json({ error: "Failed to fetch apps" });
  }
});

router.get("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const app = dbOperations.getApp(id);
    if (!app) {
      return res.status(404).json({ error: "App not found" });
    }
    res.json(app);
  } catch (error) {
    log.error("Error fetching app:", error);
    res.status(500).json({ error: "Failed to fetch app" });
  }
});

router.post("/", (req, res) => {
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
    } = req.body;
    if (!name || !repo || !current_version) {
      return res.status(400).json({
        error: "Missing required fields (name, repo, current_version)",
      });
    }
    if (typeof category !== "string" || category.trim() === "") {
      return res
        .status(400)
        .json({ error: "category is required and must be a non-empty string" });
    }
    if (typeof docker_image !== "string" || docker_image.trim() === "") {
      return res.status(400).json({
        error: "docker_image is required and must be a non-empty string",
      });
    }
    if (typeof k8s_namespace !== "string" || k8s_namespace.trim() === "") {
      return res.status(400).json({
        error: "k8s_namespace is required and must be a non-empty string",
      });
    }
    const result = dbOperations.createApp({
      name,
      url,
      repo,
      source_type: source_type || "github",
      current_version,
      category,
      docker_image,
      k8s_namespace,
    });
    log.info(
      `Successfully created app: ${name} (id: ${result.lastInsertRowid})`
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    log.error("Error creating app:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create app";
    res.status(500).json({ error: errorMessage });
  }
});

router.post("/import", async (req, res) => {
  try {
    const apps = req.body;
    if (!Array.isArray(apps)) {
      return res.status(400).json({ error: "Expected an array of apps" });
    }

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
        } = app;

        if (!name || !repo || !current_version) {
          errors.push(
            `App "${
              name || "unknown"
            }": Missing required fields (name, repo, or current_version)`
          );
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
        if (typeof docker_image !== "string" || docker_image.trim() === "") {
          errors.push(
            `App "${
              name || "unknown"
            }": docker_image is required and must be a non-empty string`
          );
          continue;
        }
        if (typeof k8s_namespace !== "string" || k8s_namespace.trim() === "") {
          errors.push(
            `App "${
              name || "unknown"
            }": k8s_namespace is required and must be a non-empty string`
          );
          continue;
        }

        // Check if app with same name already exists
        const existingApp = dbOperations.getAppByName(name);

        if (existingApp) {
          // Update existing app
          const isVersionUpdate =
            current_version && current_version !== existingApp.current_version;

          dbOperations.updateApp(existingApp.id, {
            name,
            url: url || null,
            repo,
            source_type: source_type || "github",
            current_version,
            category,
            docker_image,
            k8s_namespace,
          });

          // If version was updated, check for updates for this app instantly
          if (isVersionUpdate) {
            try {
              await checkForUpdate(existingApp.id);
            } catch (error) {
              // Log error but don't fail the import
              log.error(
                `Error checking updates after import for app ${name}:`,
                error
              );
            }
          }

          log.info(`Successfully updated app: ${name} (id: ${existingApp.id})`);
          updated++;
        } else {
          // Create new app
          const result = dbOperations.createApp({
            name,
            url: url || null,
            repo,
            source_type: source_type || "github",
            current_version,
            category,
            docker_image,
            k8s_namespace,
          });
          log.info(
            `Successfully created app: ${name} (id: ${result.lastInsertRowid})`
          );
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

    log.info(
      `App import completed: ${imported} imported (${created} created, ${updated} updated), ${errors.length} error(s)`
    );
    res.json({
      success: true,
      imported,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log.error("Error importing apps:", error);
    res.status(500).json({ error: "Failed to import apps" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      url,
      repo,
      source_type,
      current_version,
      category,
      docker_image,
      k8s_namespace,
    } = req.body;

    // Check if current_version is being updated
    const app = dbOperations.getApp(id);
    const isVersionUpdate =
      app && current_version && current_version !== app.current_version;

    // Validate required fields if they are being updated
    if (
      category !== undefined &&
      (typeof category !== "string" || category.trim() === "")
    ) {
      return res
        .status(400)
        .json({ error: "category is required and must be a non-empty string" });
    }
    if (
      docker_image !== undefined &&
      (typeof docker_image !== "string" || docker_image.trim() === "")
    ) {
      return res.status(400).json({
        error: "docker_image is required and must be a non-empty string",
      });
    }
    if (
      k8s_namespace !== undefined &&
      (typeof k8s_namespace !== "string" || k8s_namespace.trim() === "")
    ) {
      return res.status(400).json({
        error: "k8s_namespace is required and must be a non-empty string",
      });
    }

    dbOperations.updateApp(id, {
      name,
      url,
      repo,
      source_type,
      current_version,
      category,
      docker_image,
      k8s_namespace,
    });

    // If version was updated, check for updates for this app instantly
    if (isVersionUpdate) {
      try {
        await checkForUpdate(id);
      } catch (error) {
        // Log error but don't fail the update request
        log.error("Error checking updates after version update:", error);
      }
    }

    log.info(`Successfully updated app: ${app?.name || `id ${id}`}`);
    res.json({ success: true });
  } catch (error) {
    log.error("Error updating app:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update app";
    res.status(500).json({ error: errorMessage });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const app = dbOperations.getApp(id);
    dbOperations.deleteApp(id);
    log.info(`Successfully deleted app: ${app?.name || `id ${id}`}`);
    res.json({ success: true });
  } catch (error) {
    log.error("Error deleting app:", error);
    res.status(500).json({ error: "Failed to delete app" });
  }
});

export default router;
