import { Router } from "express";
import { checkForUpdates } from "../update-checker.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    await checkForUpdates();
    res.json({ success: true });
  } catch (error) {
    console.error("Error checking updates:", error);
    res.status(500).json({ error: "Failed to check updates" });
  }
});

export default router;
