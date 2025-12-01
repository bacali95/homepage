import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
} from "@nestjs/common";

import { PodsService } from "./pods.service.js";

@Controller("api/fetch-pod-version")
export class PodsController {
  private readonly logger = new Logger(PodsController.name);

  constructor(private readonly podsService: PodsService) {}

  @Get()
  async getVersionFromPod(
    @Query("dockerImage") dockerImage: string,
    @Query("namespace") namespace: string
  ) {
    try {
      if (!dockerImage) {
        throw new BadRequestException("dockerImage parameter required");
      }

      if (!namespace) {
        throw new BadRequestException("namespace parameter required");
      }

      const version = await this.podsService.getVersionFromPod(
        dockerImage,
        namespace
      );
      return { version };
    } catch (error) {
      this.logger.error("Error fetching version from pod:", error);
      throw error;
    }
  }
}
