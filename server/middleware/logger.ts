/**
 * Express Logger Middleware
 * Logs HTTP requests and responses with context
 */

import { Request, Response, NextFunction } from "express";
import { createLogger } from "../logger.js";

const log = createLogger({ service: "HTTP" });

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

/**
 * Format request duration in milliseconds
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Determine log level based on status code
 */
function getLogLevel(statusCode: number): "info" | "warn" | "error" {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

/**
 * Express middleware to log HTTP requests and responses
 */
export function httpLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip logging for health check endpoint
  if (req.path === "/healthz") {
    return next();
  }

  const startTime = Date.now();
  const method = req.method;
  const path = req.path;
  const ip = getClientIp(req);

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    log.info(`Query params: ${JSON.stringify(req.query)}`);
  }

  // Capture response finish event
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logLevel = getLogLevel(statusCode);

    const message = `${method} ${path} - ${statusCode} - ${formatDuration(
      duration
    )} - IP: ${ip}`;

    // Log with appropriate level
    if (logLevel === "error") {
      log.error(message);
    } else if (logLevel === "warn") {
      log.warn(message);
    } else {
      log.info(message);
    }
  });

  next();
}
