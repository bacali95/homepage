export interface NotificationChannel {
  send(message: string, subject?: string): Promise<void>;
  isConfigured(): boolean;
  getChannelType(): string;
}

export interface NotificationChannelConfig {
  [key: string]: any;
}
