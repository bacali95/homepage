import { Router } from "express";
import { fetchTags as fetchGhcrTags } from "../tags-fetchers/ghcr-fetcher.js";
import { fetchTags as fetchDockerHubTags } from "../tags-fetchers/dockerhub-fetcher.js";
import { fetchTags as fetchK8sTags } from "../tags-fetchers/k8s-registry-fetcher.js";
import { fetchReleases } from "../tags-fetchers/github-releases-fetcher.js";

const router = Router();

router.get("/", async (req, res) => {
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

export default router;
