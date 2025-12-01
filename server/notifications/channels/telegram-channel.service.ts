import { Injectable, Logger } from "@nestjs/common";

import {
  NotificationChannel,
  NotificationChannelConfig,
} from "./notification-channel.interface.js";

@Injectable()
export class TelegramChannelService implements NotificationChannel {
  private readonly logger = new Logger(TelegramChannelService.name);
  private config: NotificationChannelConfig = {};

  configure(config: NotificationChannelConfig): void {
    this.config = config;
  }

  getChannelType(): string {
    return "telegram";
  }

  isConfigured(): boolean {
    return !!(this.config.botToken && this.config.chatId);
  }

  async send(message: string, subject?: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(
        "Telegram channel not configured, skipping notification"
      );
      return;
    }

    try {
      const fullMessage = subject ? `*${subject}*\n\n${message}` : message;
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: fullMessage,
          parse_mode: "Markdown",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Telegram API error: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      this.logger.log("Telegram notification sent successfully");
    } catch (error) {
      this.logger.error("Failed to send Telegram notification:", error);
      throw error;
    }
  }
}
