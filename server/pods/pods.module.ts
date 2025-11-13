import { Module } from "@nestjs/common";
import { PodsController } from "./pods.controller.js";
import { PodsService } from "./pods.service.js";
import { JobsModule } from "../jobs/jobs.module.js";

@Module({
  imports: [JobsModule],
  controllers: [PodsController],
  providers: [PodsService],
})
export class PodsModule {}
