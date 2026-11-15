import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaLibSql } from "@prisma/adapter-libsql";

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
    const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
    super({ adapter });
  }

  async onModuleInit() {
    // Must be awaited: Nest runs dependents' (NotificationsService) init hooks
    // only after this module's hooks settle, and failures must abort boot.
    await this.ensureDefaultNotificationChannels();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Creates the default (disabled) notification channels if missing. */
  async ensureDefaultNotificationChannels() {
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
  }
}
