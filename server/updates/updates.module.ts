import { Module } from "@nestjs/common";
import { UpdatesController } from "./updates.controller.js";
import { UpdateCheckerService } from "./update-checker.service.js";
import { DatabaseModule } from "../database/database.module.js";
import { TagsFetchersModule } from "../tags-fetchers/tags-fetchers.module.js";
import { PodsModule } from "../pods/pods.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [
    DatabaseModule,
    TagsFetchersModule,
    PodsModule,
    NotificationsModule,
  ],
  controllers: [UpdatesController],
  providers: [UpdateCheckerService],
  exports: [UpdateCheckerService],
})
export class UpdatesModule {}
