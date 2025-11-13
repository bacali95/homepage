import { Router } from "express";
import { dbOperations } from "../db.js";
import { createLogger } from "../logger.js";

const log = createLogger({ route: "/api/categories" });
const router = Router();

router.get("/", (_req, res) => {
  try {
    const categories = dbOperations.getCategories();
    res.json(categories);
  } catch (error) {
    log.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
