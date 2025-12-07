import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from "@nestjs/common";

import { DatabaseService } from "../database/database.service.js";
import { PingService } from "./ping.service.js";

@Controller("api/ping")
export class PingController {
  private readonly logger = new Logger(PingController.name);

  constructor(
    private readonly pingService: PingService,
    private readonly databaseService: DatabaseService
  ) {}

  @Get(":id/status")
  getPingStatus(@Param("id", ParseIntPipe) id: number) {
    const app = this.databaseService.getApp(id);
    if (!app) {
      throw new NotFoundException("App not found");
    }

    const status = this.pingService.getAppStatus(id);
    const latestPing = this.databaseService.getLatestPingStatus(id);

    return {
      status: status ?? null,
      latest: latestPing
        ? {
            status: latestPing.status === 1,
            response_time: latestPing.response_time,
            status_code: latestPing.status_code,
            error_message: latestPing.error_message,
            created_at: latestPing.created_at,
          }
        : null,
    };
  }

  @Get(":id/history")
  getPingHistory(
    @Param("id", ParseIntPipe) id: number,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    const app = this.databaseService.getApp(id);
    if (!app) {
      throw new NotFoundException("App not found");
    }

    const limitNum = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    const offsetNum = offset ? Math.max(parseInt(offset, 10) || 0, 0) : 0;
    const history = this.databaseService.getPingHistory(
      id,
      limitNum,
      offsetNum
    );
    const totalCount = this.databaseService.getPingHistoryCount(id);

    return {
      data: history.map((entry) => ({
        id: entry.id,
        status: entry.status === 1,
        response_time: entry.response_time,
        status_code: entry.status_code,
        error_message: entry.error_message,
        created_at: entry.created_at,
      })),
      total: totalCount,
      limit: limitNum,
      offset: offsetNum,
    };
  }
}
