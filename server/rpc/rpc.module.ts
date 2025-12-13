import { Module } from "@nestjs/common";

import { AppsModule } from "../apps/apps.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { UpdatesModule } from "../updates/updates.module.js";
import { RpcController } from "./rpc.controller.js";

@Module({
  imports: [AppsModule, DatabaseModule, UpdatesModule, NotificationsModule],
  controllers: [RpcController],
})
export class RpcModule {}
