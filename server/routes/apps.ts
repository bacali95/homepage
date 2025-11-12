import { Router } from "express";
import { dbOperations } from "../db.js";
import { checkForUpdate } from "../update-checker.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const apps = dbOperations.getAllApps();
    res.json(apps);
  } catch (error) {
    console.error("Error fetching apps:", error);
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
    console.error("Error fetching app:", error);
    res.status(500).json({ error: "Failed to fetch app" });
  }
});

router.post("/", (req, res) => {
  try {
    const {
      name,
      url,
      repo,
      github_repo,
      source_type,
      current_version,
      category,
      docker_image,
      k8s_namespace,
    } = req.body;
    if (!name || (!repo && !github_repo) || !current_version) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = dbOperations.createApp({
      name,
      url,
      repo: repo || github_repo,
      github_repo: repo || github_repo,
      source_type: source_type || "github",
      current_version,
      category: category || null,
      docker_image: docker_image || null,
      k8s_namespace: k8s_namespace || null,
    });
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error creating app:", error);
    res.status(500).json({ error: "Failed to create app" });
  }
});

router.post("/import", (req, res) => {
  try {
    const apps = req.body;
    if (!Array.isArray(apps)) {
      return res.status(400).json({ error: "Expected an array of apps" });
    }

    const errors: string[] = [];
    let imported = 0;

    for (const app of apps) {
      try {
        const {
          name,
          url,
          repo,
          github_repo,
          source_type,
          current_version,
          category,
          docker_image,
          k8s_namespace,
        } = app;

        if (!name || (!repo && !github_repo) || !current_version) {
          errors.push(
            `App "${
              name || "unknown"
            }": Missing required fields (name, repo/github_repo, or current_version)`
          );
          continue;
        }

        dbOperations.createApp({
          name,
          url: url || null,
          repo: repo || github_repo,
          github_repo: repo || github_repo,
          source_type: source_type || "github",
          current_version,
          category: category || null,
          docker_image: docker_image || null,
          k8s_namespace: k8s_namespace || null,
        });
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

    res.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing apps:", error);
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
      github_repo,
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

    dbOperations.updateApp(id, {
      name,
      url,
      repo: repo || github_repo,
      github_repo: repo || github_repo,
      source_type,
      current_version,
      category: category || null,
      docker_image: docker_image || null,
      k8s_namespace: k8s_namespace || null,
    });

    // If version was updated, check for updates for this app instantly
    if (isVersionUpdate) {
      try {
        await checkForUpdate(id);
      } catch (error) {
        // Log error but don't fail the update request
        console.error("Error checking updates after version update:", error);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating app:", error);
    res.status(500).json({ error: "Failed to update app" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    dbOperations.deleteApp(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting app:", error);
    res.status(500).json({ error: "Failed to delete app" });
  }
});

export default router;
