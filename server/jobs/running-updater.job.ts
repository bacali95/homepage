import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { AppsService } from "../apps/apps.service.js";

@Injectable()
export class RunningUpdaterJob implements OnModuleInit {
  private readonly logger = new Logger(RunningUpdaterJob.name);

  constructor(private readonly appsService: AppsService) {}

  // Run every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: "k8s-pod-version-updater",
  })
  async handleCron() {
    this.logger.log("Running scheduled K8s pod version update");
    try {
      await this.appsService.updateVersionsFromPods();
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
      await this.appsService.updateVersionsFromPods();
      this.logger.log("Initial K8s pod version update completed successfully");
    } catch (error) {
      this.logger.error("Error in initial K8s pod version update:", error);
    }
  }
}
