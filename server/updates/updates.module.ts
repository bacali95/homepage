import { Module } from "@nestjs/common";

import { AppsModule } from "../apps/apps.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { TagsFetchersModule } from "../tags-fetchers/tags-fetchers.module.js";
import { UpdateCheckerService } from "./update-checker.service.js";

@Module({
  imports: [
    AppsModule,
    DatabaseModule,
    TagsFetchersModule,
    NotificationsModule,
  ],
  providers: [UpdateCheckerService],
  exports: [UpdateCheckerService],
})
export class UpdatesModule {}
