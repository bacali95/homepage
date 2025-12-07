import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { DatabaseService } from "../database/database.service.js";
import { PingService } from "./ping.service.js";

@Injectable()
export class PingJob implements OnModuleInit {
  private readonly logger = new Logger(PingJob.name);

  constructor(
    private readonly pingService: PingService,
    private readonly databaseService: DatabaseService
  ) {}

  // Run every minute to check which apps need pinging
  @Cron(CronExpression.EVERY_MINUTE, {
    name: "ping-checker",
  })
  async handleCron() {
    try {
      const apps = this.databaseService.getAppsWithPingEnabled();
      const now = Date.now();

      for (const app of apps) {
        if (!app.ping_frequency || app.ping_frequency <= 0) {
          continue;
        }

        // Get the last ping time
        const latestPing = this.databaseService.getLatestPingStatus(app.id);
        if (latestPing) {
          const lastPingTime = new Date(latestPing.created_at).getTime();
          const timeSinceLastPing = now - lastPingTime;
          const frequencyMs = app.ping_frequency * 60 * 1000; // Convert minutes to ms

          // Only ping if enough time has passed
          if (timeSinceLastPing < frequencyMs) {
            continue;
          }
        }

        // Ping this app
        await this.pingService.pingApp(app).catch((error) => {
          this.logger.error(`Error pinging app ${app.name}:`, error);
        });
      }
    } catch (error) {
      this.logger.error("Error in ping checker job:", error);
    }
  }

  // Run daily at 2 AM to clean up old ping history (keep only 1 week)
  @Cron("0 2 * * *", {
    name: "ping-history-cleanup",
  })
  async cleanupOldPingHistory() {
    this.logger.log("Running ping history cleanup");
    try {
      const deletedCount = this.databaseService.cleanupOldPingHistory(7);
      this.logger.log(
        `Ping history cleanup completed: deleted ${deletedCount} old entries`
      );
    } catch (error) {
      this.logger.error("Error in ping history cleanup:", error);
    }
  }

  // Run on application start to initialize status cache
  async onModuleInit() {
    this.logger.log("Initializing ping service on startup");
    try {
      // Ping all apps once on startup to initialize status
      await this.pingService.pingAllApps();
      this.logger.log("Initial ping cycle completed");

      // Also run cleanup on startup to remove any old entries
      const deletedCount = this.databaseService.cleanupOldPingHistory(7);
      if (deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${deletedCount} old ping history entries on startup`
        );
      }
    } catch (error) {
      this.logger.error("Error in initial ping cycle:", error);
    }
  }
}
