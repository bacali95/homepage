import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { K8sPodUpdaterService } from "./k8s-pod-updater.service.js";

@Injectable()
export class K8sPodUpdaterJob implements OnModuleInit {
  private readonly logger = new Logger(K8sPodUpdaterJob.name);

  constructor(private readonly k8sPodUpdaterService: K8sPodUpdaterService) {}

  // Run every 5 minutes
  @Cron("*/5 * * * *", {
    name: "k8s-pod-version-updater",
  })
  async handleCron() {
    this.logger.log("Running scheduled K8s pod version update");
    try {
      await this.k8sPodUpdaterService.updateVersionsFromPods();
      this.logger.log(
        "Scheduled K8s pod version update completed successfully"
      );
    } catch (error) {
      this.logger.error("Error in scheduled K8s pod version update:", error);
    }
  }

  // Run on application start
  async onModuleInit() {
    this.logger.log("Running initial K8s pod version update on startup");
    try {
      await this.k8sPodUpdaterService.updateVersionsFromPods();
      this.logger.log("Initial K8s pod version update completed successfully");
    } catch (error) {
      this.logger.error("Error in initial K8s pod version update:", error);
    }
  }
}
