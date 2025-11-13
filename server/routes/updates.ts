import { Router } from "express";
import { checkForUpdates } from "../update-checker.js";
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

export default router;
