import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module.js";
import { AppsService } from "./apps.service.js";
import { K8sPodsService } from "./k8s-pods.service.js";

@Module({
  imports: [DatabaseModule],
  providers: [AppsService, K8sPodsService],
  exports: [AppsService],
})
export class AppsModule {}
