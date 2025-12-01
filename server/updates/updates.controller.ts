import { Controller, Logger, Param, ParseIntPipe, Post } from "@nestjs/common";

import { UpdateCheckerService } from "./update-checker.service.js";

@Controller("api/check-updates")
export class UpdatesController {
  private readonly logger = new Logger(UpdatesController.name);

  constructor(private readonly updateCheckerService: UpdateCheckerService) {}

  @Post()
  async checkForUpdates() {
    try {
      await this.updateCheckerService.checkForUpdates();
      this.logger.log("Manual update check triggered successfully");
      return { success: true };
    } catch (error) {
      this.logger.error("Error checking updates:", error);
      throw error;
    }
  }

  @Post(":id")
  async checkForUpdate(@Param("id", ParseIntPipe) id: number) {
    try {
      await this.updateCheckerService.checkForUpdate(id);
      this.logger.log(`Manual update check triggered for app ID: ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error("Error checking updates for app:", error);
      throw error;
    }
  }
}
