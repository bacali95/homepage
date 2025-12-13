import type {
  NotificationChannel,
  NotificationChannelType,
} from "../../../generated/client/client.js";
import {
  EmailChannelConfig,
  TelegramChannelConfig,
} from "../../notifications/channels/notification-channel.interface.js";
import { route } from "../route.js";

export const notificationChannelHandler = {
  getAll: route().handle(({ context: { prisma } }) =>
    prisma.notificationChannel.findMany({
      orderBy: { channelType: "asc" },
    })
  ),
  update: route<
    Pick<NotificationChannel, "channelType" | "enabled" | "config">
  >().handle(
    async ({ params: data, context: { prisma, notificationsService } }) => {
      const updatedChannel = await prisma.notificationChannel.update({
        where: { channelType: data.channelType },
        data,
      });

      await notificationsService.reinitializeChannel(
        data.channelType,
        JSON.parse(data.config)
      );

      return updatedChannel;
    }
  ),
  test: route<{
    channelType: NotificationChannelType;
    config: EmailChannelConfig | TelegramChannelConfig;
  }>().handle(
    ({ params: { channelType, config }, context: { notificationsService } }) =>
      notificationsService.testChannel(channelType, config)
  ),
};
