import type { ConnectionOptions } from "tls";
import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

import {
  NotificationChannel,
  NotificationChannelConfig,
} from "./notification-channel.interface.js";

@Injectable()
export class EmailChannelService implements NotificationChannel {
  private readonly logger = new Logger(EmailChannelService.name);
  private config: NotificationChannelConfig = {};

  configure(config: NotificationChannelConfig): void {
    this.config = config;
  }

  getChannelType(): string {
    return "email";
  }

  isConfigured(): boolean {
    return !!(
      (
        this.config.smtpHost &&
        this.config.smtpPort &&
        this.config.fromEmail &&
        this.config.toEmail &&
        (this.config.smtpUser || !this.config.smtpPassword)
      ) // Either no auth or both user/pass
    );
  }

  async send(message: string, subject?: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn("Email channel not configured, skipping notification");
      return;
    }

    try {
      // Determine security settings
      const port = Number(this.config.smtpPort);
      const security = this.config.security || "auto"; // auto, none, tls, starttls

      let secure = false;
      let requireTLS = false;
      let tls: ConnectionOptions | undefined = undefined;

      if (security === "tls" || (security === "auto" && port === 465)) {
        // SSL/TLS connection (port 465)
        secure = true;
      } else if (
        security === "starttls" ||
        (security === "auto" && (port === 587 || port === 25))
      ) {
        // STARTTLS (ports 587, 25)
        requireTLS = true;
        tls = {
          rejectUnauthorized: this.config.rejectUnauthorized !== false,
        };
      } else if (security === "none") {
        // No encryption
        secure = false;
        requireTLS = false;
      } else {
        // Auto-detect based on port
        secure = port === 465;
        if (port === 587 || port === 25) {
          requireTLS = true;
          tls = {
            rejectUnauthorized: this.config.rejectUnauthorized !== false,
          };
        }
      }

      const transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: port,
        secure: secure,
        requireTLS: requireTLS,
        tls: tls,
        auth:
          this.config.smtpUser && this.config.smtpPassword
            ? {
                user: this.config.smtpUser,
                pass: this.config.smtpPassword,
              }
            : undefined,
      });

      await transporter.sendMail({
        from: this.config.fromEmail,
        to: this.config.toEmail,
        subject: subject || "Homepage Update Notification",
        text: message,
        html: message.replace(/\n/g, "<br>"),
      });

      this.logger.log("Email notification sent successfully");
    } catch (error) {
      this.logger.error("Failed to send email notification:", error);
      throw error;
    }
  }
}
