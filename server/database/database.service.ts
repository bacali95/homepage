import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import {
  NotificationChannelType,
  PrismaClient,
} from "../../generated/client/client.js";

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
    super({ adapter });
  }

  onModuleInit() {
    this.ensureDefaultNotificationChannels();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureDefaultNotificationChannels() {
    try {
      const existingChannels = await this.notificationChannel.findMany({
        select: { channelType: true },
      });
      const existingChannelTypes = existingChannels.map((c) => c.channelType);

      if (!existingChannelTypes.includes(NotificationChannelType.EMAIL)) {
        await this.notificationChannel.create({
          data: {
            channelType: NotificationChannelType.EMAIL,
            enabled: false,
            config: JSON.stringify({}),
          },
        });
      }
      if (!existingChannelTypes.includes(NotificationChannelType.TELEGRAM)) {
        await this.notificationChannel.create({
          data: {
            channelType: NotificationChannelType.TELEGRAM,
            enabled: false,
            config: JSON.stringify({}),
          },
        });
      }
    } catch (error) {
      // If tables don't exist yet, we'll handle it via migrations
      console.warn("Could not ensure default notification channels:", error);
    }
  }
}
