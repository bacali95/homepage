import { Express } from "express";
import appsRouter from "./apps.js";
import releasesRouter from "./releases.js";
import categoriesRouter from "./categories.js";
import updatesRouter from "./updates.js";
import podsRouter from "./pods.js";

export function registerRoutes(app: Express) {
  app.use("/api/apps", appsRouter);
  app.use("/api/releases", releasesRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/check-updates", updatesRouter);
  app.use("/api/fetch-pod-version", podsRouter);
}
