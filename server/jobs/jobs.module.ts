import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { UpdateCheckerJob } from "./update-checker.job.js";
import { K8sPodUpdaterJob } from "./k8s-pod-updater.job.js";
import { K8sPodUpdaterService } from "./k8s-pod-updater.service.js";
import { DatabaseModule } from "../database/database.module.js";
import { UpdatesModule } from "../updates/updates.module.js";

@Module({
  imports: [ScheduleModule, DatabaseModule, UpdatesModule],
  providers: [UpdateCheckerJob, K8sPodUpdaterJob, K8sPodUpdaterService],
  exports: [K8sPodUpdaterService],
})
export class JobsModule {}
