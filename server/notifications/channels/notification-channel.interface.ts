export interface NotificationChannel {
  send(message: string, subject?: string): Promise<void>;
  isConfigured(): boolean;
  getChannelType(): string;
}

export interface NotificationChannelConfig {
  [key: string]: string | number | boolean;
}

export interface EmailChannelConfig {
  smtpHost: string;
  smtpPort: number;
  security: "auto" | "none" | "tls" | "starttls";
  fromEmail: string;
  toEmail: string;
  smtpUser?: string;
  smtpPassword?: string;
}

export interface TelegramChannelConfig {
  chatId: string;
  botToken: string;
}
