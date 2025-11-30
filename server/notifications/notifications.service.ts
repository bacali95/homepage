import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService, App } from "../database/database.service.js";
import { EmailChannelService } from "./channels/email-channel.service.js";
import { TelegramChannelService } from "./channels/telegram-channel.service.js";
import { NotificationChannel } from "./channels/notification-channel.interface.js";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private channels: Map<string, NotificationChannel> = new Map();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailChannel: EmailChannelService,
    private readonly telegramChannel: TelegramChannelService
  ) {
    // Register channels
    this.channels.set("email", this.emailChannel);
    this.channels.set("telegram", this.telegramChannel);
  }

  /**
   * Initialize notification channels with their configurations
   */
  async initializeChannels(): Promise<void> {
    const dbChannels = this.databaseService.getNotificationChannels();

    for (const dbChannel of dbChannels) {
      if (dbChannel.enabled) {
        const channel = this.channels.get(dbChannel.channel_type);
        if (channel) {
          try {
            const config = JSON.parse(dbChannel.config || "{}");
            if (channel === this.emailChannel) {
              this.emailChannel.configure(config);
            } else if (channel === this.telegramChannel) {
              this.telegramChannel.configure(config);
            }
            this.logger.log(
              `Initialized ${dbChannel.channel_type} notification channel`
            );
          } catch (error) {
            this.logger.error(
              `Failed to initialize ${dbChannel.channel_type} channel:`,
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
    const channels = this.databaseService.getNotificationChannels();
    const appPreferences = this.databaseService.getAppNotificationPreferences(
      app.id
    );

    // Create a map of app preferences for quick lookup
    const appPrefsMap = new Map(
      appPreferences.map((pref) => [pref.channel_type, pref.enabled === 1])
    );

    const message = this.formatUpdateMessage(app);
    const subject = `Update Available: ${app.name}`;

    const notifications: Promise<void>[] = [];

    for (const dbChannel of channels) {
      // Check if channel is globally enabled
      if (dbChannel.enabled !== 1) {
        continue;
      }

      // Check app-specific preference (default to enabled if not set)
      const appEnabled = appPrefsMap.get(dbChannel.channel_type) ?? true;
      if (!appEnabled) {
        this.logger.debug(
          `Skipping ${dbChannel.channel_type} for app ${app.name} (disabled for this app)`
        );
        continue;
      }

      const channel = this.channels.get(dbChannel.channel_type);
      if (channel && channel.isConfigured()) {
        notifications.push(
          channel.send(message, subject).catch((error) => {
            this.logger.error(
              `Failed to send ${dbChannel.channel_type} notification:`,
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

Current Version: ${app.current_version || "Unknown"}
Latest Version: ${app.latest_version || "Unknown"}

${app.url ? `App URL: ${app.url}` : ""}`.trim();
  }

  /**
   * Get all notification channels with their status
   */
  getChannels() {
    const dbChannels = this.databaseService.getNotificationChannels();
    return dbChannels.map((dbChannel) => {
      const channel = this.channels.get(dbChannel.channel_type);
      const config = JSON.parse(dbChannel.config || "{}");
      return {
        channel_type: dbChannel.channel_type,
        enabled: dbChannel.enabled === 1,
        configured: channel ? channel.isConfigured() : false,
        config,
      };
    });
  }

  /**
   * Update channel configuration
   */
  async updateChannel(
    channelType: string,
    enabled: boolean,
    config: Record<string, any>
  ): Promise<void> {
    this.databaseService.updateNotificationChannel(channelType, {
      enabled,
      config,
    });

    // Reinitialize the channel
    const channel = this.channels.get(channelType);
    if (channel) {
      if (channel === this.emailChannel) {
        this.emailChannel.configure(config);
      } else if (channel === this.telegramChannel) {
        this.telegramChannel.configure(config);
      }
    }

    this.logger.log(`Updated ${channelType} notification channel`);
  }

  /**
   * Test a notification channel with the provided configuration
   */
  async testChannel(
    channelType: string,
    config: Record<string, any>
  ): Promise<void> {
    const channel = this.channels.get(channelType);
    if (!channel) {
      throw new Error(`Channel type ${channelType} not found`);
    }

    // Temporarily configure the channel with test config
    if (channel === this.emailChannel) {
      this.emailChannel.configure(config);
    } else if (channel === this.telegramChannel) {
      this.telegramChannel.configure(config);
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
