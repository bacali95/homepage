import { Module } from "@nestjs/common";
import { AppsController } from "./apps.controller.js";
import { AppsService } from "./apps.service.js";
import { DatabaseModule } from "../database/database.module.js";
import { UpdatesModule } from "../updates/updates.module.js";

@Module({
  imports: [DatabaseModule, UpdatesModule],
  controllers: [AppsController],
  providers: [AppsService],
  exports: [AppsService],
})
export class AppsModule {}
