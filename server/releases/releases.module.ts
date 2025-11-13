import { Module } from "@nestjs/common";
import { ReleasesController } from "./releases.controller.js";
import { ReleasesService } from "./releases.service.js";
import { TagsFetchersModule } from "../tags-fetchers/tags-fetchers.module.js";

@Module({
  imports: [TagsFetchersModule],
  controllers: [ReleasesController],
  providers: [ReleasesService],
})
export class ReleasesModule {}
