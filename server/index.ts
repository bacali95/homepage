import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  registerUpdateCheckerJob,
  registerK8sPodVersionUpdaterJob,
  jobScheduler,
} from "./jobs/index.js";
import { registerRoutes } from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Register API routes
registerRoutes(app);

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
