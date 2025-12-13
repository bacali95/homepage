import { Mail, MessageSquare } from "lucide-react";

import { NotificationChannelType } from "../../../generated/client/enums";
import { ChannelConfig } from "./types";

export const CHANNEL_CONFIGS: Record<NotificationChannelType, ChannelConfig> = {
  [NotificationChannelType.EMAIL]: {
    icon: Mail,
    label: "Email",
    fields: [
      {
        key: "smtpHost",
        label: "SMTP Host",
        type: "text",
        placeholder: "smtp.gmail.com",
        gridCols: 2,
      },
      {
        key: "smtpPort",
        label: "SMTP Port",
        type: "number",
        placeholder: "587",
        gridCols: 2,
      },
      {
        key: "security",
        label: "Security",
        type: "select",
        options: [
          { value: "auto", label: "Auto (detect from port)" },
          { value: "none", label: "None" },
          { value: "tls", label: "TLS/SSL" },
          { value: "starttls", label: "STARTTLS" },
        ],
        helpText: "Auto: 465 = TLS/SSL, 587/25 = STARTTLS",
      },
      {
        key: "fromEmail",
        label: "From Email",
        type: "email",
        placeholder: "sender@example.com",
      },
      {
        key: "toEmail",
        label: "To Email",
        type: "email",
        placeholder: "recipient@example.com",
      },
      {
        key: "smtpUser",
        label: "SMTP Username (optional)",
        type: "text",
        placeholder: "username",
        gridCols: 2,
      },
      {
        key: "smtpPassword",
        label: "SMTP Password (optional)",
        type: "password",
        placeholder: "password",
        gridCols: 2,
      },
    ],
  },
  [NotificationChannelType.TELEGRAM]: {
    icon: MessageSquare,
    label: "Telegram",
    fields: [
      {
        key: "chatId",
        label: "Chat ID",
        type: "text",
        placeholder: "123456789",
        helpText: "Your Telegram user ID or group chat ID",
      },
      {
        key: "botToken",
        label: "Bot Token",
        type: "password",
        placeholder: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
        helpText: "Get your bot token from @BotFather on Telegram",
      },
    ],
  },
};
