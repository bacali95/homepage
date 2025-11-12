import express from "express";
import cors from "cors";
import { dbOperations } from "./db.js";
import { fetchReleases } from "./github.js";
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
    const { name, url, github_repo, current_version } = req.body;
    if (!name || !url || !github_repo || !current_version) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const result = dbOperations.createApp({
      name,
      url,
      github_repo,
      current_version,
    });
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error creating app:", error);
    res.status(500).json({ error: "Failed to create app" });
  }
});

app.put("/api/apps/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, url, github_repo, current_version } = req.body;
    dbOperations.updateApp(id, {
      name,
      url,
      github_repo,
      current_version,
    });
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

app.get("/api/github/releases", async (req, res) => {
  try {
    const repo = req.query.repo as string;
    if (!repo) {
      return res.status(400).json({ error: "Repository parameter required" });
    }
    const releases = await fetchReleases(repo);
    res.json(releases);
  } catch (error) {
    console.error("Error fetching releases:", error);
    res.status(500).json({ error: "Failed to fetch releases" });
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
