import type { BaseContext } from "typesafe-rpc";
import { Route } from "typesafe-rpc/server";

import type { PrismaClient } from "../../generated/client/client";
import type { AppsService } from "../apps/apps.service";
import type { NotificationsService } from "../notifications/notifications.service";
import type { UpdateCheckerService } from "../updates/update-checker.service";

export type Context = BaseContext & {
  prisma: PrismaClient;
  appsService: AppsService;
  updateCheckerService: UpdateCheckerService;
  notificationsService: NotificationsService;
};

export const route = <Params extends object, C extends Context = Context>() =>
  new Route<Params, C>();
