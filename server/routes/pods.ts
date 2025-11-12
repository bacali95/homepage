import { Router } from "express";
import { getVersionFromPod } from "../k8s-pod.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const dockerImage = req.query.dockerImage as string;
    const namespace = req.query.namespace as string;

    if (!dockerImage) {
      return res.status(400).json({ error: "dockerImage parameter required" });
    }

    if (!namespace) {
      return res.status(400).json({ error: "namespace parameter required" });
    }

    const version = await getVersionFromPod(dockerImage, namespace);
    res.json({ version });
  } catch (error) {
    console.error("Error fetching version from pod:", error);
    res.status(500).json({ error: "Failed to fetch version from pod" });
  }
});

export default router;
