import type {
  AppCreateInput,
  AppUpdateInput,
} from "../../../generated/client/models.js";
import type { App } from "../../../src/types.js";
import { route } from "../route.js";

export const appHandler = {
  getAll: route().handle(({ context: { prisma } }) =>
    prisma.app.findMany({
      include: {
        versionPreferences: true,
        pingPreferences: true,
        appNotificationPreferences: true,
      },
    })
  ),
  getById: route<{ id: number }>().handle(
    ({ params: { id }, context: { prisma } }) =>
      prisma.app.findUnique({
        where: { id },
        include: {
          versionPreferences: true,
          pingPreferences: true,
          appNotificationPreferences: true,
        },
      })
  ),
  getAllCategories: route().handle(({ context: { prisma } }) =>
    prisma.app
      .findMany({
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      })
      .then((apps) => apps.map((app) => app.category))
  ),
  create: route<App>().handle(
    async ({ params: data, context: { prisma, updateCheckerService } }) => {
      const newApp = await prisma.app.create({ data: createApp(data) });
      await updateCheckerService.checkForUpdate(newApp.id);
      return newApp;
    }
  ),
  update: route<App>().handle(
    async ({
      params: { id, ...data },
      context: { prisma, updateCheckerService },
    }) => {
      const updatedApp = await prisma.app.update({
        where: { id },
        data: updateApp(id, data),
      });
      await updateCheckerService.checkForUpdate(id);
      return updatedApp;
    }
  ),
  checkUpdates: route().handle(
    async ({ context: { updateCheckerService } }) => {
      await updateCheckerService.checkForUpdates();
      return { success: true };
    }
  ),
  checkAppUpdates: route<{ id: number }>().handle(
    async ({ params: { id }, context: { updateCheckerService } }) => {
      await updateCheckerService.checkForUpdate(id);
      return { success: true };
    }
  ),
  resolveCurrentVersion: route<{ id: number }>().handle(
    async ({ params: { id }, context: { prisma, appsService } }) => {
      const appVersionPreference = await prisma.appVersionPreference.findUnique(
        { where: { appId: id } }
      );

      if (!appVersionPreference) {
        throw new Error(`App with id ${id} not found`);
      }

      return appsService.getRunningVersion(appVersionPreference);
    }
  ),
  getPingStatus: route<{ appId: number }>().handle(
    async ({ params: { appId }, context: { prisma } }) =>
      prisma.pingHistory.findFirst({
        where: { appId },
        orderBy: { createdAt: "desc" },
      })
  ),
  getPingHistory: route<{
    appId: number;
    pageSize: number;
    offset: number;
  }>().handle(({ params: { appId, pageSize, offset }, context: { prisma } }) =>
    Promise.all([
      prisma.pingHistory.findMany({
        where: { appId },
        skip: offset,
        take: pageSize,
      }),
      prisma.pingHistory.count({ where: { appId } }),
    ])
  ),
  delete: route<{ id: number }>().handle(
    ({ params: { id }, context: { prisma } }) =>
      prisma.app.delete({ where: { id } })
  ),
};

function createApp({
  versionPreferences,
  pingPreferences,
  appNotificationPreferences,
  ...data
}: App): AppCreateInput {
  return {
    ...data,
    versionPreferences: versionPreferences
      ? {
          create: removeAppId(versionPreferences),
        }
      : undefined,
    pingPreferences: pingPreferences
      ? {
          create: removeAppId(pingPreferences),
        }
      : undefined,
    appNotificationPreferences: appNotificationPreferences
      ? {
          create: appNotificationPreferences.map(removeAppId),
        }
      : undefined,
  };
}

function removeAppId<T extends { appId: number }>({
  appId: _,
  ...obj
}: T): Omit<T, "appId"> {
  return obj;
}

function updateApp(
  id: number,
  {
    versionPreferences,
    pingPreferences,
    appNotificationPreferences,
    ...data
  }: Omit<App, "id">
): AppUpdateInput {
  return {
    ...data,
    versionPreferences: versionPreferences
      ? {
          upsert: {
            where: { appId: id },
            update: removeAppId(versionPreferences),
            create: removeAppId(versionPreferences),
          },
        }
      : undefined,
    pingPreferences: pingPreferences
      ? {
          upsert: {
            where: { appId: id },
            update: removeAppId(pingPreferences),
            create: removeAppId(pingPreferences),
          },
        }
      : undefined,
    appNotificationPreferences: appNotificationPreferences
      ? {
          upsert: appNotificationPreferences.map((preference) => ({
            where: {
              appId_channelType: {
                appId: id,
                channelType: preference.channelType,
              },
            },
            update: removeAppId(preference),
            create: removeAppId(preference),
          })),
        }
      : undefined,
  };
}
