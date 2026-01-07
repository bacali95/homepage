import https from "https";
import { URL } from "url";
import { Injectable, Logger } from "@nestjs/common";

import type { App } from "../../src/types.js";
import { DatabaseService } from "../database/database.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);
  private readonly statusCache = new Map<number, boolean>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsService: NotificationsService
  ) {}

  /**
   * Make an HTTP request using standard fetch
   */
  private async makeFetchRequest(
    url: string,
    signal: AbortSignal
  ): Promise<{ statusCode: number; ok: boolean }> {
    const response = await fetch(url, {
      method: "GET",
      signal,
      headers: {
        "User-Agent": "Homepage-Ping/1.0",
      },
    });

    return {
      statusCode: response.status,
      ok: response.ok,
    };
  }

  /**
   * Make an HTTPS request with SSL verification disabled
   */
  private async makeHttpsRequestWithoutSslVerification(
    url: URL,
    signal: AbortSignal
  ): Promise<{ statusCode: number; ok: boolean }> {
    return new Promise<{ statusCode: number; ok: boolean }>(
      (resolve, reject) => {
        const options = {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: "GET",
          headers: {
            "User-Agent": "Homepage-Ping/1.0",
          },
          rejectUnauthorized: false, // Ignore SSL errors
        };

        const req = https.request(options, (res) => {
          // Consume response to free up connection
          res.on("data", () => {});
          res.on("end", () => {
            const statusCode = res.statusCode || 0;
            resolve({
              statusCode,
              ok: statusCode >= 200 && statusCode < 300,
            });
          });
        });

        req.on("error", reject);

        // Handle abort signal
        if (signal.aborted) {
          req.destroy();
          reject(new Error("Request aborted"));
          return;
        }

        signal.addEventListener("abort", () => {
          req.destroy();
          reject(new Error("Request aborted"));
        });

        req.end();
      }
    );
  }

  /**
   * Execute a ping request and return the result
   */
  private async executePingRequest(
    url: string,
    ignoreSsl: boolean,
    signal: AbortSignal
  ): Promise<{ statusCode: number; ok: boolean }> {
    if (ignoreSsl) {
      const urlObj = new URL(url);
      if (urlObj.protocol === "https:") {
        return this.makeHttpsRequestWithoutSslVerification(urlObj, signal);
      }
      // For non-HTTPS URLs, use regular fetch even if ignoreSsl is true
    }

    return this.makeFetchRequest(url, signal);
  }

  /**
   * Ping a single app
   */
  async pingApp(app: App): Promise<void> {
    if (!app.pingPreferences?.enabled) {
      return;
    }

    const startTime = Date.now();
    let status = false;
    let responseTime: number | null = null;
    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await this.executePingRequest(
        app.pingPreferences.url,
        app.pingPreferences.ignoreSsl,
        controller.signal
      );

      clearTimeout(timeoutId);
      responseTime = Date.now() - startTime;
      statusCode = response.statusCode;
      status = response.ok;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.debug(`Ping aborted for ${app.name}`);
        return;
      }
      responseTime = Date.now() - startTime;
      status = false;
      errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.debug(`Ping failed for ${app.name}: ${errorMessage}`);
    }

    // Store ping result in history
    await this.databaseService.pingHistory.create({
      data: {
        appId: app.id,
        status,
        responseTime,
        statusCode,
        errorMessage,
      },
    });

    // Check for status change and send notification if needed
    const previousStatus = this.statusCache.get(app.id);
    if (previousStatus !== undefined && previousStatus !== status) {
      // Status changed
      await this.notificationsService.notifyPingStatusChange(
        app,
        status,
        responseTime,
        statusCode,
        errorMessage
      );
    }

    // Update cache
    this.statusCache.set(app.id, status);

    this.logger.debug(
      `Pinged ${app.name}: ${status ? "UP" : "DOWN"} (${responseTime}ms)`
    );
  }

  /**
   * Ping all apps that have ping enabled
   */
  async pingAllApps(): Promise<void> {
    const apps = await this.databaseService.app.findMany({
      where: { pingPreferences: { enabled: true } },
      include: {
        pingPreferences: true,
        versionPreferences: true,
        appNotificationPreferences: true,
      },
    });
    this.logger.log(`Pinging ${apps.length} app(s)`);

    // Initialize cache with current statuses if not already set
    for (const app of apps) {
      if (!this.statusCache.has(app.id)) {
        const latestPing = await this.getLatestPingStatus(app.id);
        if (latestPing) {
          this.statusCache.set(app.id, latestPing.status);
        }
      }
    }

    // Ping all apps in parallel
    const pingPromises = apps.map((app) =>
      this.pingApp(app).catch((error) => {
        this.logger.error(`Error pinging app ${app.name}:`, error);
      })
    );

    await Promise.allSettled(pingPromises);
    this.logger.log("Ping cycle completed");
  }

  /**
   * Get current ping status for an app
   */
  async getAppStatus(appId: number): Promise<boolean | null> {
    if (this.statusCache.has(appId)) {
      return this.statusCache.get(appId)!;
    }

    const latestPing = await this.getLatestPingStatus(appId);
    if (latestPing) {
      this.statusCache.set(appId, latestPing.status);
      return latestPing.status;
    }

    return null;
  }

  getLatestPingStatus(appId: number) {
    return this.databaseService.pingHistory.findFirst({
      where: { appId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Delete ping history entries older than the specified number of days
   * @param daysToKeep Number of days of history to keep (default: 7)
   * @returns Number of deleted rows
   */
  async cleanupOldPingHistory(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.databaseService.pingHistory.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    return result.count;
  }
}
