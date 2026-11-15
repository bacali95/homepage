import { beforeEach, describe, expect, it, vi } from "vitest";

import type { App } from "../../src/types.js";
import { UpdateCheckerService } from "./update-checker.service.js";

type VersionPrefs = NonNullable<App["versionPreferences"]>;

function makeApp(
  overrides: Partial<VersionPrefs> | null = {},
  appOverrides: Partial<App> = {}
): App {
  return {
    id: 1,
    name: "Sonarr",
    category: "Media",
    url: "https://sonarr.local",
    icon: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    pingPreferences: null,
    appNotificationPreferences: [],
    versionPreferences:
      overrides === null
        ? null
        : {
            enabled: true,
            sourceType: "GITHUB_RELEASES",
            sourceRepo: "owner/repo",
            runningEnvironment: "KUBERNETES",
            runningConfig: JSON.stringify({
              dockerImage: "owner/repo",
              k8sNamespace: "media",
            }),
            currentVersion: null,
            latestVersion: null,
            hasUpdate: false,
            versionExtractionRegex: null,
            appId: 1,
            ...overrides,
          },
    ...appOverrides,
  } as App;
}

function setup() {
  const appsService = { getRunningVersion: vi.fn() };
  const db = {
    app: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    appVersionPreference: { update: vi.fn() },
  };
  const ghcr = { getLatestTag: vi.fn() };
  const dockerhub = { getLatestTag: vi.fn() };
  const k8s = { getLatestTag: vi.fn() };
  const github = { getLatestTag: vi.fn() };
  const notifications = { notifyAppUpdate: vi.fn() };

  const service = new UpdateCheckerService(
    appsService as never,
    db as never,
    ghcr as never,
    dockerhub as never,
    k8s as never,
    github as never,
    notifications as never
  );
  return {
    service,
    appsService,
    db,
    ghcr,
    dockerhub,
    k8s,
    github,
    notifications,
  };
}

describe("UpdateCheckerService.checkForUpdate", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  const load = (app: App | null) =>
    ctx.db.app.findUnique.mockResolvedValue(app);

  it("throws when the app does not exist", async () => {
    load(null);
    await expect(ctx.service.checkForUpdate(42)).rejects.toThrow(
      "App with id 42 not found"
    );
  });

  it("does nothing for apps without version checking enabled", async () => {
    load(makeApp({ enabled: false }));
    await ctx.service.checkForUpdate(1);
    expect(ctx.appsService.getRunningVersion).not.toHaveBeenCalled();
    expect(ctx.github.getLatestTag).not.toHaveBeenCalled();
    expect(ctx.db.appVersionPreference.update).not.toHaveBeenCalled();
    expect(ctx.db.app.update).not.toHaveBeenCalled();
  });

  it("does nothing for apps without any version preferences", async () => {
    load(makeApp(null));
    await ctx.service.checkForUpdate(1);
    expect(ctx.appsService.getRunningVersion).not.toHaveBeenCalled();
  });

  describe("source type routing", () => {
    it.each([
      ["DOCKER_HUB", "dockerhub"],
      ["GHCR", "ghcr"],
      ["K8S_REGISTRY", "k8s"],
      ["GITHUB_RELEASES", "github"],
    ] as const)("%s uses the %s fetcher", async (sourceType, key) => {
      load(
        makeApp({
          sourceType,
          sourceRepo: "some/repo",
          versionExtractionRegex: "(\\d+)",
        })
      );
      ctx.appsService.getRunningVersion.mockResolvedValue("1.0.0");
      ctx[key].getLatestTag.mockResolvedValue("1.0.0");

      await ctx.service.checkForUpdate(1);

      expect(ctx[key].getLatestTag).toHaveBeenCalledWith("some/repo", "(\\d+)");
      const others = (["dockerhub", "ghcr", "k8s", "github"] as const).filter(
        (other) => other !== key
      );
      for (const other of others) {
        expect(ctx[other].getLatestTag).not.toHaveBeenCalled();
      }
    });
  });

  describe("version comparison", () => {
    it("persists the running version as currentVersion", async () => {
      load(makeApp());
      ctx.appsService.getRunningVersion.mockResolvedValue("1.0.0");
      ctx.github.getLatestTag.mockResolvedValue("1.0.0");

      await ctx.service.checkForUpdate(1);

      expect(ctx.db.appVersionPreference.update).toHaveBeenCalledWith({
        where: { appId: 1 },
        data: { currentVersion: "1.0.0" },
      });
    });

    it("flags an update and notifies when latest > running", async () => {
      const app = makeApp();
      load(app);
      ctx.appsService.getRunningVersion.mockResolvedValue("v1.2.3");
      ctx.github.getLatestTag.mockResolvedValue("v1.10.0");
      const refreshed = makeApp({ hasUpdate: true, latestVersion: "v1.10.0" });
      // First findUnique = initial load, second = reload for notification
      ctx.db.app.findUnique
        .mockResolvedValueOnce(app)
        .mockResolvedValueOnce(refreshed);

      await ctx.service.checkForUpdate(1);

      expect(ctx.db.app.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          versionPreferences: {
            update: { latestVersion: "v1.10.0", hasUpdate: true },
          },
        },
      });
      expect(ctx.notifications.notifyAppUpdate).toHaveBeenCalledTimes(1);
      expect(ctx.notifications.notifyAppUpdate).toHaveBeenCalledWith(refreshed);
    });

    it("does not notify again when the app already had an update flagged", async () => {
      load(makeApp({ hasUpdate: true }));
      ctx.appsService.getRunningVersion.mockResolvedValue("1.0.0");
      ctx.github.getLatestTag.mockResolvedValue("2.0.0");

      await ctx.service.checkForUpdate(1);

      expect(ctx.db.app.update).toHaveBeenCalledTimes(1);
      expect(ctx.notifications.notifyAppUpdate).not.toHaveBeenCalled();
    });

    it("swallows notification failures", async () => {
      load(makeApp());
      ctx.appsService.getRunningVersion.mockResolvedValue("1.0.0");
      ctx.github.getLatestTag.mockResolvedValue("2.0.0");
      ctx.notifications.notifyAppUpdate.mockRejectedValue(new Error("smtp"));

      await expect(ctx.service.checkForUpdate(1)).resolves.toBeUndefined();
      expect(ctx.db.app.update).toHaveBeenCalledTimes(1);
    });

    it("clears hasUpdate when running version equals latest", async () => {
      load(makeApp({ hasUpdate: true }));
      ctx.appsService.getRunningVersion.mockResolvedValue("1.2.3");
      ctx.github.getLatestTag.mockResolvedValue("v1.2.3");

      await ctx.service.checkForUpdate(1);

      expect(ctx.db.app.update).not.toHaveBeenCalled();
      expect(ctx.db.appVersionPreference.update).toHaveBeenLastCalledWith({
        where: { appId: 1 },
        data: { latestVersion: "v1.2.3", hasUpdate: false },
      });
      expect(ctx.notifications.notifyAppUpdate).not.toHaveBeenCalled();
    });

    it("does not flag an update when running is newer than latest", async () => {
      load(makeApp());
      ctx.appsService.getRunningVersion.mockResolvedValue("2.0.0");
      ctx.github.getLatestTag.mockResolvedValue("1.9.0");

      await ctx.service.checkForUpdate(1);

      expect(ctx.db.app.update).not.toHaveBeenCalled();
      expect(ctx.db.appVersionPreference.update).toHaveBeenLastCalledWith({
        where: { appId: 1 },
        data: { latestVersion: "1.9.0", hasUpdate: false },
      });
    });

    it("stores latestVersion without flagging an update when running version is unknown", async () => {
      load(makeApp());
      ctx.appsService.getRunningVersion.mockResolvedValue(null);
      ctx.github.getLatestTag.mockResolvedValue("3.0.0");

      await ctx.service.checkForUpdate(1);

      // currentVersion must not be overwritten with null
      expect(ctx.db.appVersionPreference.update).toHaveBeenCalledTimes(1);
      expect(ctx.db.appVersionPreference.update).toHaveBeenCalledWith({
        where: { appId: 1 },
        data: { latestVersion: "3.0.0", hasUpdate: false },
      });
      expect(ctx.db.app.update).not.toHaveBeenCalled();
    });

    it("resets latestVersion and hasUpdate when nothing is found upstream", async () => {
      load(makeApp({ hasUpdate: true, latestVersion: "1.0.0" }));
      ctx.appsService.getRunningVersion.mockResolvedValue("1.0.0");
      ctx.github.getLatestTag.mockResolvedValue(null);

      await ctx.service.checkForUpdate(1);

      expect(ctx.db.appVersionPreference.update).toHaveBeenLastCalledWith({
        where: { appId: 1 },
        data: { latestVersion: null, hasUpdate: false },
      });
    });

    it("compares using the extraction regex when configured", async () => {
      // Without the regex "1.2.3-r5" vs "1.2.3-r10" would compare "r5" > "r10"
      // as strings; with it only the captured numbers are compared.
      load(
        makeApp({
          versionExtractionRegex: "^(\\d+)\\.(\\d+)\\.(\\d+)-r(\\d+)$",
          sourceType: "DOCKER_HUB",
        })
      );
      ctx.appsService.getRunningVersion.mockResolvedValue("1.2.3-r5");
      ctx.dockerhub.getLatestTag.mockResolvedValue("1.2.3-r10");

      await ctx.service.checkForUpdate(1);

      expect(ctx.db.app.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            versionPreferences: {
              update: { latestVersion: "1.2.3-r10", hasUpdate: true },
            },
          },
        })
      );
    });
  });

  it("rethrows errors from the running-version lookup", async () => {
    load(makeApp());
    ctx.appsService.getRunningVersion.mockRejectedValue(new Error("k8s down"));
    await expect(ctx.service.checkForUpdate(1)).rejects.toThrow("k8s down");
  });
});

describe("UpdateCheckerService.checkForUpdates", () => {
  it("checks every app and keeps going when one fails", async () => {
    const ctx = setup();
    const a = makeApp({}, { id: 1, name: "A" });
    const b = makeApp({}, { id: 2, name: "B" });
    const c = makeApp({ enabled: false }, { id: 3, name: "C" });
    ctx.db.app.findMany.mockResolvedValue([a, b, c]);
    ctx.appsService.getRunningVersion
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("1.0.0");
    ctx.github.getLatestTag.mockResolvedValue("1.0.0");

    await expect(ctx.service.checkForUpdates()).resolves.toBeUndefined();

    // A failed, B was processed after, C skipped (no running-version lookup)
    expect(ctx.appsService.getRunningVersion).toHaveBeenCalledTimes(2);
    expect(ctx.github.getLatestTag).toHaveBeenCalledTimes(1);
    expect(ctx.db.appVersionPreference.update).toHaveBeenCalledWith({
      where: { appId: 2 },
      data: { latestVersion: "1.0.0", hasUpdate: false },
    });
  });

  it("includes related preference tables in the query", async () => {
    const ctx = setup();
    ctx.db.app.findMany.mockResolvedValue([]);
    await ctx.service.checkForUpdates();
    expect(ctx.db.app.findMany).toHaveBeenCalledWith({
      include: {
        versionPreferences: true,
        pingPreferences: true,
        appNotificationPreferences: true,
      },
    });
  });
});
