import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { DatabaseModule } from "../database/database.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { PingService } from "./ping.service.js";

@Module({
  imports: [ScheduleModule, DatabaseModule, NotificationsModule],
  providers: [PingService],
  exports: [PingService],
})
export class PingModule {}
