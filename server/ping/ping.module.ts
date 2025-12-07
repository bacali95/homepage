import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { DatabaseModule } from "../database/database.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { PingController } from "./ping.controller.js";
import { PingJob } from "./ping.job.js";
import { PingService } from "./ping.service.js";

@Module({
  imports: [ScheduleModule, DatabaseModule, NotificationsModule],
  controllers: [PingController],
  providers: [PingService, PingJob],
  exports: [PingService],
})
export class PingModule {}
