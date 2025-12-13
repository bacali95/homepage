import { appHandler } from "./app.handler.js";
import { notificationChannelHandler } from "./notification-channel.handler.js";

export const handlers = {
  app: appHandler,
  notificationChannel: notificationChannelHandler,
};

export type RpcSchema = typeof handlers;
