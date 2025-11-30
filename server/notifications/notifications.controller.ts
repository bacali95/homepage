import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  ParseIntPipe,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service.js";
import { DatabaseService } from "../database/database.service.js";

@Controller("api/notifications")
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly databaseService: DatabaseService
  ) {}

  @Get("channels")
  getChannels() {
    try {
      return this.notificationsService.getChannels();
    } catch (error) {
      this.logger.error("Error fetching notification channels:", error);
      throw error;
    }
  }

  @Put("channels/:channelType")
  async updateChannel(
    @Param("channelType") channelType: string,
    @Body() body: { enabled?: boolean; config?: Record<string, any> }
  ) {
    try {
      const { enabled = false, config = {} } = body;

      if (typeof enabled !== "boolean") {
        throw new BadRequestException("enabled must be a boolean");
      }

      if (typeof config !== "object" || Array.isArray(config)) {
        throw new BadRequestException("config must be an object");
      }

      await this.notificationsService.updateChannel(
        channelType,
        enabled,
        config
      );

      this.logger.log(`Updated notification channel: ${channelType}`);
      return { success: true };
    } catch (error) {
      this.logger.error("Error updating notification channel:", error);
      throw error;
    }
  }

  @Get("apps/:appId/preferences")
  getAppPreferences(@Param("appId", ParseIntPipe) appId: number) {
    try {
      const preferences =
        this.databaseService.getAppNotificationPreferences(appId);
      return preferences.map((pref) => ({
        channel_type: pref.channel_type,
        enabled: pref.enabled === 1,
      }));
    } catch (error) {
      this.logger.error("Error fetching app notification preferences:", error);
      throw error;
    }
  }

  @Post("apps/:appId/preferences")
  async setAppPreference(
    @Param("appId", ParseIntPipe) appId: number,
    @Body() body: { channel_type: string; enabled: boolean }
  ) {
    try {
      const { channel_type, enabled } = body;

      if (!channel_type || typeof channel_type !== "string") {
        throw new BadRequestException("channel_type is required");
      }

      if (typeof enabled !== "boolean") {
        throw new BadRequestException("enabled must be a boolean");
      }

      // Verify app exists
      const app = this.databaseService.getApp(appId);
      if (!app) {
        throw new BadRequestException("App not found");
      }

      this.databaseService.setAppNotificationPreference(
        appId,
        channel_type,
        enabled
      );

      this.logger.log(
        `Updated notification preference for app ${appId}, channel ${channel_type}`
      );
      return { success: true };
    } catch (error) {
      this.logger.error("Error setting app notification preference:", error);
      throw error;
    }
  }

  @Post("channels/:channelType/test")
  async testChannel(
    @Param("channelType") channelType: string,
    @Body() body: { config: Record<string, any> }
  ) {
    try {
      const { config = {} } = body;

      if (typeof config !== "object" || Array.isArray(config)) {
        throw new BadRequestException("config must be an object");
      }

      await this.notificationsService.testChannel(channelType, config);

      this.logger.log(`Test notification sent via ${channelType}`);
      return { success: true, message: "Test notification sent successfully" };
    } catch (error) {
      this.logger.error("Error testing notification channel:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send test notification";
      throw new BadRequestException(errorMessage);
    }
  }
}
