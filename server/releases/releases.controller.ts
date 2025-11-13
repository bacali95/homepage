import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ReleasesService } from "./releases.service.js";

@Controller("api/releases")
export class ReleasesController {
  private readonly logger = new Logger(ReleasesController.name);

  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  async getReleases(
    @Query("source") source: string,
    @Query("repo") repo: string
  ) {
    try {
      if (!source || !repo) {
        throw new BadRequestException("Source and repo parameters required");
      }

      return await this.releasesService.getReleases(source, repo);
    } catch (error) {
      this.logger.error("Error fetching releases:", error);
      throw error;
    }
  }
}
