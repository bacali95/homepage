import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { AppsModule } from "../apps/apps.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { PingModule } from "../ping/ping.module.js";
import { UpdatesModule } from "../updates/updates.module.js";
import { PingJob } from "./ping.job.js";
import { RunningUpdaterJob } from "./running-updater.job.js";
import { UpdateCheckerJob } from "./update-checker.job.js";

@Module({
  imports: [
    ScheduleModule,
    DatabaseModule,
    UpdatesModule,
    AppsModule,
    PingModule,
  ],
  providers: [PingJob, RunningUpdaterJob, UpdateCheckerJob],
})
export class JobsModule {}
