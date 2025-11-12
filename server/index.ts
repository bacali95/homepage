import "dotenv/config";
import express from "express";
import cors from "cors";
import { dbOperations } from "./db.js";
import { fetchTags as fetchGhcrTags } from "./github.js";
import { fetchTags as fetchDockerHubTags } from "./dockerhub.js";
import { fetchTags as fetchK8sTags } from "./k8s-registry.js";
import { fetchReleases } from "./github-releases.js";
import { startUpdateChecker } from "./update-checker.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/apps", (req, res) => {
  try {
    const apps = dbOperations.getAllApps();
    res.json(apps);
  } catch (error) {
    console.error("Error fetching apps:", error);
    res.status(500).json({ error: "Failed to fetch apps" });
  }
});

app.get("/api/apps/:id", (req, res) => {
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

app.post("/api/apps", (req, res) => {
  try {
    const {
      name,
      url,
      repo,
      github_repo,
      source_type,
      current_version,
      category,
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
    });
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error creating app:", error);
    res.status(500).json({ error: "Failed to create app" });
  }
});

app.put("/api/apps/:id", async (req, res) => {
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
    });

    // If version was updated, check for updates for this app instantly
    if (isVersionUpdate) {
      try {
        const { checkForUpdate } = await import("./update-checker.js");
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

app.delete("/api/apps/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    dbOperations.deleteApp(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting app:", error);
    res.status(500).json({ error: "Failed to delete app" });
  }
});

app.get("/api/releases", async (req, res) => {
  try {
    const source = req.query.source as string;
    const repo = req.query.repo as string;

    if (!source || !repo) {
      return res
        .status(400)
        .json({ error: "Source and repo parameters required" });
    }

    if (source === "github") {
      const releases = await fetchReleases(repo);
      res.json(releases);
    } else if (source === "ghcr") {
      const tags = await fetchGhcrTags(repo);
      res.json(tags);
    } else if (source === "dockerhub") {
      const tags = await fetchDockerHubTags(repo);
      res.json(tags);
    } else if (source === "k8s") {
      const tags = await fetchK8sTags(repo);
      res.json(tags);
    } else {
      return res.status(400).json({ error: "Invalid source type" });
    }
  } catch (error) {
    console.error("Error fetching releases:", error);
    res.status(500).json({ error: "Failed to fetch releases" });
  }
});

app.get("/api/categories", (req, res) => {
  try {
    const categories = dbOperations.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/check-updates", async (req, res) => {
  try {
    const { checkForUpdates } = await import("./update-checker.js");
    await checkForUpdates();
    res.json({ success: true });
  } catch (error) {
    console.error("Error checking updates:", error);
    res.status(500).json({ error: "Failed to check updates" });
  }
});

// Start update checker
startUpdateChecker();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
