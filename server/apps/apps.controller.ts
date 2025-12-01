import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from "@nestjs/common";

import { AppsService } from "./apps.service.js";

@Controller("api/apps")
export class AppsController {
  private readonly logger = new Logger(AppsController.name);

  constructor(private readonly appsService: AppsService) {}

  @Get()
  getAllApps() {
    try {
      return this.appsService.getAllApps();
    } catch (error) {
      this.logger.error("Error fetching apps:", error);
      throw error;
    }
  }

  @Get(":id")
  getApp(@Param("id", ParseIntPipe) id: number) {
    try {
      const app = this.appsService.getApp(id);
      if (!app) {
        throw new NotFoundException("App not found");
      }
      return app;
    } catch (error) {
      this.logger.error("Error fetching app:", error);
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createApp(@Body() body: any) {
    try {
      const {
        name,
        url,
        repo,
        source_type,
        current_version,
        category,
        docker_image,
        k8s_namespace,
        icon,
      } = body;

      if (!name) {
        throw new BadRequestException("Missing required fields (name)");
      }
      if (typeof category !== "string" || category.trim() === "") {
        throw new BadRequestException(
          "category is required and must be a non-empty string"
        );
      }

      const result = this.appsService.createApp({
        name,
        url,
        repo,
        source_type: source_type || "github",
        current_version,
        category,
        docker_image,
        k8s_namespace,
        icon,
      });

      this.logger.log(
        `Successfully created app: ${name} (id: ${result.lastInsertRowid})`
      );
      return { id: result.lastInsertRowid };
    } catch (error) {
      this.logger.error("Error creating app:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create app";
      throw new Error(errorMessage);
    }
  }

  @Post("import")
  async importApps(@Body() body: any) {
    try {
      const apps = body;
      if (!Array.isArray(apps)) {
        throw new BadRequestException("Expected an array of apps");
      }

      const result = await this.appsService.importApps(apps);
      this.logger.log(
        `App import completed: ${result.imported} imported (${
          result.created
        } created, ${result.updated} updated), ${
          result.errors?.length || 0
        } error(s)`
      );
      return result;
    } catch (error) {
      this.logger.error("Error importing apps:", error);
      throw error;
    }
  }

  @Put(":id")
  async updateApp(@Param("id", ParseIntPipe) id: number, @Body() body: any) {
    try {
      const {
        name,
        url,
        repo,
        source_type,
        current_version,
        category,
        docker_image,
        k8s_namespace,
        icon,
      } = body;

      // Validate required fields if they are being updated
      if (
        name !== undefined &&
        (typeof name !== "string" || name.trim() === "")
      ) {
        throw new BadRequestException(
          "name is required and must be a non-empty string"
        );
      }
      if (
        category !== undefined &&
        (typeof category !== "string" || category.trim() === "")
      ) {
        throw new BadRequestException(
          "category is required and must be a non-empty string"
        );
      }

      const result = await this.appsService.updateApp(id, {
        name,
        url,
        repo,
        source_type,
        current_version,
        category,
        docker_image,
        k8s_namespace,
        icon,
      });

      const app = this.appsService.getApp(id);
      this.logger.log(`Successfully updated app: ${app?.name || `id ${id}`}`);
      return result;
    } catch (error) {
      this.logger.error("Error updating app:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update app";
      throw new Error(errorMessage);
    }
  }

  @Delete(":id")
  deleteApp(@Param("id", ParseIntPipe) id: number) {
    try {
      const result = this.appsService.deleteApp(id);
      this.logger.log(
        `Successfully deleted app: ${result.app?.name || `id ${id}`}`
      );
      return { success: true };
    } catch (error) {
      this.logger.error("Error deleting app:", error);
      throw error;
    }
  }
}
