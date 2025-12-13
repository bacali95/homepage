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
    // Convert Express request to native Request
    const nativeRequest = this.expressToNativeRequest(request);

    return createRpcHandler<RpcSchema, Context>({
      context: {
        request: nativeRequest,
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

  private expressToNativeRequest(expressReq: express.Request): Request {
    const protocol = expressReq.protocol || "http";
    const host = expressReq.get("host") || "";
    const url = `${protocol}://${host}${expressReq.originalUrl || expressReq.url}`;

    // Get headers
    const headers = new Headers();
    Object.keys(expressReq.headers).forEach((key) => {
      const value = expressReq.headers[key];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    });

    // Get body - Express body parser should have already parsed it
    // For native Request, we need to provide the raw body or JSON
    const body = expressReq.body ? JSON.stringify(expressReq.body) : undefined;

    // Ensure Content-Type is set if we have a body
    if (body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return new Request(url, {
      method: expressReq.method,
      headers,
      body,
    });
  }
}
