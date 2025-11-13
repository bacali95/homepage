import { Router } from "express";
import { checkForUpdates, checkForUpdate } from "../update-checker.js";
import { createLogger } from "../logger.js";

const log = createLogger({ route: "/api/check-updates" });
const router = Router();

router.post("/", async (_req, res) => {
  try {
    await checkForUpdates();
    log.info("Manual update check triggered successfully");
    res.json({ success: true });
  } catch (error) {
    log.error("Error checking updates:", error);
    res.status(500).json({ error: "Failed to check updates" });
  }
});

router.post("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid app ID" });
    }
    await checkForUpdate(id);
    log.info(`Manual update check triggered for app ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    log.error("Error checking updates for app:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to check updates",
    });
  }
});

export default router;
