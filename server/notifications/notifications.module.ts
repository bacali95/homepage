import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module.js";
import { EmailChannelService } from "./channels/email-channel.service.js";
import { TelegramChannelService } from "./channels/telegram-channel.service.js";
import { NotificationsService } from "./notifications.service.js";

@Module({
  imports: [DatabaseModule],
  providers: [
    NotificationsService,
    EmailChannelService,
    TelegramChannelService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
