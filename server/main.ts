import "reflect-metadata";
import "dotenv/config";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import express from "express";

import { AppModule } from "./app.module.js";

const logger = new Logger("Bootstrap");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // Set no-cache headers for index.html in production
  if (process.env.NODE_ENV === "production") {
    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        // Only apply to index.html requests (SPA routing)
        if (
          req.path === "/" ||
          (!req.path.startsWith("/api") && !req.path.includes("."))
        ) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
        next();
      }
    );
  }

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);
  logger.log(`Server running on http://localhost:${PORT}`);
}

bootstrap().catch((error) => {
  logger.error(
    `Failed to start server: ${
      error instanceof Error ? error.message : String(error)
    }`,
    error.stack
  );
  process.exit(1);
});
