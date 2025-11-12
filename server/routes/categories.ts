import { Router } from "express";
import { dbOperations } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const categories = dbOperations.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
