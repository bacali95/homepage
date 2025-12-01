import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { DatabaseModule } from "../database/database.module.js";
import { PodsModule } from "../pods/pods.module.js";
import { UpdatesModule } from "../updates/updates.module.js";
import { K8sPodUpdaterJob } from "./k8s-pod-updater.job.js";
import { K8sPodUpdaterService } from "./k8s-pod-updater.service.js";
import { UpdateCheckerJob } from "./update-checker.job.js";

@Module({
  imports: [ScheduleModule, DatabaseModule, UpdatesModule, PodsModule],
  providers: [UpdateCheckerJob, K8sPodUpdaterJob, K8sPodUpdaterService],
  exports: [K8sPodUpdaterService],
})
export class JobsModule {}
