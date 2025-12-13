import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";

import { NotificationChannelType } from "../../generated/client/enums.js";
import type { App } from "../../src/types.js";
import { DatabaseService } from "../database/database.service.js";
import { EmailChannelService } from "./channels/email-channel.service.js";
import {
  NotificationChannel,
  type EmailChannelConfig,
  type TelegramChannelConfig,
} from "./channels/notification-channel.interface.js";
import { TelegramChannelService } from "./channels/telegram-channel.service.js";

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private channels: Map<NotificationChannelType, NotificationChannel> =
    new Map();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailChannel: EmailChannelService,
    private readonly telegramChannel: TelegramChannelService
  ) {
    // Register channels
    this.channels.set(NotificationChannelType.EMAIL, this.emailChannel);
    this.channels.set(NotificationChannelType.TELEGRAM, this.telegramChannel);
  }

  onModuleInit() {
    this.initializeChannels();
  }

  /**
   * Initialize notification channels with their configurations
   */
  private async initializeChannels(): Promise<void> {
    const dbChannels = await this.databaseService.notificationChannel.findMany({
      orderBy: { channelType: "asc" },
    });

    for (const dbChannel of dbChannels) {
      if (dbChannel.enabled) {
        const channel = this.channels.get(dbChannel.channelType);
        if (channel) {
          try {
            const config = JSON.parse(dbChannel.config || "{}");
            if (channel === this.emailChannel) {
              this.emailChannel.configure(config);
            } else if (channel === this.telegramChannel) {
              this.telegramChannel.configure(config);
            }
            this.logger.log(
              `Initialized ${dbChannel.channelType} notification channel`
            );
          } catch (error) {
            this.logger.error(
              `Failed to initialize ${dbChannel.channelType} channel:`,
              error
            );
          }
        }
      }
    }
  }

  /**
   * Send a notification about an app update
   */
  async notifyAppUpdate(app: App): Promise<void> {
    const channels = await this.databaseService.notificationChannel.findMany({
      orderBy: { channelType: "asc" },
    });
    const appPreferences =
      await this.databaseService.appNotificationPreference.findMany({
        where: { appId: app.id },
      });

    // Create a map of app preferences for quick lookup
    const appPrefsMap = new Map(
      appPreferences.map((pref) => [pref.channelType, pref.enabled])
    );

    const message = this.formatUpdateMessage(app);
    const subject = `Update Available: ${app.name}`;

    const notifications: Promise<void>[] = [];

    for (const dbChannel of channels) {
      // Check if channel is globally enabled
      if (!dbChannel.enabled) {
        continue;
      }

      // Check app-specific preference (default to enabled if not set)
      const appEnabled = appPrefsMap.get(dbChannel.channelType) ?? true;
      if (!appEnabled) {
        this.logger.debug(
          `Skipping ${dbChannel.channelType} for app ${app.name} (disabled for this app)`
        );
        continue;
      }

      const channel = this.channels.get(dbChannel.channelType);
      if (channel && channel.isConfigured()) {
        notifications.push(
          channel.send(message, subject).catch((error) => {
            this.logger.error(
              `Failed to send ${dbChannel.channelType} notification:`,
              error
            );
          })
        );
      }
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Format the update notification message
   */
  private formatUpdateMessage(app: App): string {
    return `An update is available for ${app.name}!

Current Version: ${app.versionPreferences?.currentVersion || "Unknown"}
Latest Version: ${app.versionPreferences?.latestVersion || "Unknown"}

${app.url ? `App URL: ${app.url}` : ""}`.trim();
  }

  /**
   * Send a notification about ping status change
   */
  async notifyPingStatusChange(
    app: App,
    isUp: boolean,
    responseTime: number | null,
    statusCode: number | null,
    errorMessage: string | null
  ): Promise<void> {
    const channels = await this.databaseService.notificationChannel.findMany({
      orderBy: { channelType: "asc" },
    });
    const appPreferences =
      await this.databaseService.appNotificationPreference.findMany({
        where: { appId: app.id },
      });

    // Create a map of app preferences for quick lookup
    const appPrefsMap = new Map(
      appPreferences.map((pref) => [pref.channelType, pref.enabled])
    );

    const message = this.formatPingStatusMessage(
      app,
      isUp,
      responseTime,
      statusCode,
      errorMessage
    );
    const subject = `${app.name} is ${isUp ? "UP" : "DOWN"}`;

    const notifications: Promise<void>[] = [];

    for (const dbChannel of channels) {
      // Check if channel is globally enabled
      if (!dbChannel.enabled) {
        continue;
      }

      // Check app-specific preference (default to enabled if not set)
      const appEnabled = appPrefsMap.get(dbChannel.channelType) ?? true;
      if (!appEnabled) {
        this.logger.debug(
          `Skipping ${dbChannel.channelType} for app ${app.name} (disabled for this app)`
        );
        continue;
      }

      const channel = this.channels.get(dbChannel.channelType);
      if (channel && channel.isConfigured()) {
        notifications.push(
          channel.send(message, subject).catch((error) => {
            this.logger.error(
              `Failed to send ${dbChannel.channelType} notification:`,
              error
            );
          })
        );
      }
    }

    await Promise.allSettled(notifications);
  }

  /**
   * Format the ping status notification message
   */
  private formatPingStatusMessage(
    app: App,
    isUp: boolean,
    responseTime: number | null,
    statusCode: number | null,
    errorMessage: string | null
  ): string {
    const status = isUp ? "UP" : "DOWN";
    const pingUrl = app.pingPreferences?.url || app.url || "N/A";

    let message = `${app.name} is now ${status}!\n\n`;
    message += `Ping URL: ${pingUrl}\n`;

    if (isUp) {
      message += `Response Time: ${responseTime ? `${responseTime}ms` : "N/A"}\n`;
      if (statusCode) {
        message += `Status Code: ${statusCode}\n`;
      }
    } else {
      if (statusCode) {
        message += `Status Code: ${statusCode}\n`;
      }
      if (errorMessage) {
        message += `Error: ${errorMessage}\n`;
      }
    }

    return message.trim();
  }

  /**
   * Reinitialize a channel with new configuration
   */
  async reinitializeChannel(
    channelType: NotificationChannelType,
    config: EmailChannelConfig | TelegramChannelConfig
  ): Promise<void> {
    // Reinitialize the channel
    const channel = this.channels.get(channelType);
    if (channel) {
      if (channel === this.emailChannel) {
        this.emailChannel.configure(config as EmailChannelConfig);
      } else if (channel === this.telegramChannel) {
        this.telegramChannel.configure(config as TelegramChannelConfig);
      }
    }

    this.logger.log(`Reinitialized ${channelType} notification channel`);
  }

  /**
   * Test a notification channel with the provided configuration
   */
  async testChannel(
    channelType: NotificationChannelType,
    config: EmailChannelConfig | TelegramChannelConfig
  ): Promise<void> {
    const channel = this.channels.get(channelType);
    if (!channel) {
      throw new Error(`Channel type ${channelType} not found`);
    }

    // Temporarily configure the channel with test config
    if (channel === this.emailChannel) {
      this.emailChannel.configure(config as EmailChannelConfig);
    } else if (channel === this.telegramChannel) {
      this.telegramChannel.configure(config as TelegramChannelConfig);
    }

    // Check if configured
    if (!channel.isConfigured()) {
      throw new Error(`Channel ${channelType} is not properly configured`);
    }

    // Send test message
    const testMessage = `This is a test notification from Homepage!

If you received this message, your ${channelType} notification channel is configured correctly.`;

    const testSubject = `Test Notification - ${channelType}`;

    await channel.send(testMessage, testSubject);

    this.logger.log(`Test notification sent via ${channelType}`);
  }
}
