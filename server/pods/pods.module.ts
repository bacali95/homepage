import { Module } from "@nestjs/common";

import { PodsController } from "./pods.controller.js";
import { PodsService } from "./pods.service.js";

@Module({
  controllers: [PodsController],
  providers: [PodsService],
  exports: [PodsService],
})
export class PodsModule {}
