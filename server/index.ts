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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/healthz", (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok" });
});

// Register API routes
registerRoutes(app);

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));

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
      res.sendFile(path.join(distPath, "index.html"));
    }
  );
}

// Register background jobs
registerUpdateCheckerJob();
registerK8sPodVersionUpdaterJob();

// Start the job scheduler
jobScheduler.start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await jobScheduler.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await jobScheduler.shutdown();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
