import { Module, OnModuleInit } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { NotificationsService } from "./notifications.service.js";
import { NotificationsController } from "./notifications.controller.js";
import { EmailChannelService } from "./channels/email-channel.service.js";
import { TelegramChannelService } from "./channels/telegram-channel.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailChannelService,
    TelegramChannelService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule implements OnModuleInit {
  constructor(private readonly notificationsService: NotificationsService) {}

  async onModuleInit() {
    await this.notificationsService.initializeChannels();
  }
}
