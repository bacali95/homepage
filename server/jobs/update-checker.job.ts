import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { UpdateCheckerService } from "../updates/update-checker.service.js";

@Injectable()
export class UpdateCheckerJob implements OnModuleInit {
  private readonly logger = new Logger(UpdateCheckerJob.name);

  constructor(private readonly updateCheckerService: UpdateCheckerService) {}

  // Run every 6 hours
  @Cron("0 */6 * * *", {
    name: "update-checker",
  })
  async handleCron() {
    this.logger.log("Running scheduled update check");
    try {
      await this.updateCheckerService.checkForUpdates();
      this.logger.log("Scheduled update check completed successfully");
    } catch (error) {
      this.logger.error("Error in scheduled update check:", error);
    }
  }

  // Run on application start
  async onModuleInit() {
    this.logger.log("Running initial update check on startup");
    try {
      await this.updateCheckerService.checkForUpdates();
      this.logger.log("Initial update check completed successfully");
    } catch (error) {
      this.logger.error("Error in initial update check:", error);
    }
  }
}
