import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {
  registerUpdateCheckerJob,
  registerK8sPodVersionUpdaterJob,
  jobScheduler,
} from "./jobs/index.js";
import { registerRoutes } from "./routes/index.js";
import { createLogger } from "./logger.js";
import { httpLogger } from "./middleware/logger.js";

const log = createLogger({ service: "Server" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// HTTP request logging middleware
app.use(httpLogger);

// Health check endpoint
app.get("/healthz", (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok" });
});

// Register API routes
registerRoutes(app);
log.info("API routes registered successfully");

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(
    express.static(distPath, {
      cacheControl: true,
      maxAge: 31536000,
      immutable: true,
    })
  );

  // Handle React routing - return all non-API requests to React app
  app.get(
    "*",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api")) {
        return next();
      }
      // Don't cache index.html to ensure users get the latest version
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    }
  );
}

// Register background jobs
registerUpdateCheckerJob();
log.info("Update checker job registered");
registerK8sPodVersionUpdaterJob();
log.info("K8s pod version updater job registered");

// Start the job scheduler
jobScheduler.start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  log.info("SIGTERM received, shutting down gracefully...");
  await jobScheduler.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  log.info("SIGINT received, shutting down gracefully...");
  await jobScheduler.shutdown();
  process.exit(0);
});

app.listen(PORT, () => {
  log.info(`Server running on http://localhost:${PORT}`);
});
