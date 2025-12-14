import { Controller, Logger, Post, Req } from "@nestjs/common";
import type express from "express";
import { createRpcHandler } from "typesafe-rpc/server";

import { AppsService } from "../apps/apps.service.js";
import { DatabaseService } from "../database/database.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { UpdateCheckerService } from "../updates/update-checker.service.js";
import { handlers, type RpcSchema } from "./handlers/index.js";
import type { Context } from "./route.js";

@Controller("rpc")
export class RpcController {
  private readonly logger = new Logger(RpcController.name);

  constructor(
    private readonly appsService: AppsService,
    private readonly databaseService: DatabaseService,
    private readonly updateCheckerService: UpdateCheckerService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Post("")
  async fetchPodVersion(@Req() request: express.Request) {
    return createRpcHandler<RpcSchema, Context>({
      context: {
        request,
        prisma: this.databaseService,
        appsService: this.appsService,
        updateCheckerService: this.updateCheckerService,
        notificationsService: this.notificationsService,
      },
      operations: handlers,
      errorHandler: (error) => {
        this.logger.error("RPC Error:", error);
        return new Response(
          JSON.stringify({ error: "Internal Server Error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    });
  }
}
