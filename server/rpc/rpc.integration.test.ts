/**
 * RPC integration test: boots a real Nest HTTP app with the real RpcController,
 * real handlers, real Prisma (libsql) against a temp SQLite file migrated with
 * `prisma migrate deploy`, and drives it with the real typesafe-rpc client.
 * Only network/k8s/notification edges are stubbed.
 */
import { execFileSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import type { AddressInfo } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { Module, type INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { createRpcClient } from "typesafe-rpc/client";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { App } from "../../src/types.js";
import { AppsService } from "../apps/apps.service.js";
import { DatabaseService } from "../database/database.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { DockerhubFetcherService } from "../tags-fetchers/dockerhub-fetcher.service.js";
import { GhcrFetcherService } from "../tags-fetchers/ghcr-fetcher.service.js";
import { GithubReleasesFetcherService } from "../tags-fetchers/github-releases-fetcher.service.js";
import { K8sRegistryFetcherService } from "../tags-fetchers/k8s-registry-fetcher.service.js";
import { UpdateCheckerService } from "../updates/update-checker.service.js";
import type { RpcSchema } from "./handlers/index.js";
import { RpcController } from "./rpc.controller.js";

const appsServiceStub = { getRunningVersion: vi.fn() };
const githubStub = { getLatestTag: vi.fn() };
const notificationsStub = {
  notifyAppUpdate: vi.fn(),
  reinitializeChannel: vi.fn(),
  testChannel: vi.fn(),
};
const unusedFetcher = { getLatestTag: vi.fn() };

@Module({
  controllers: [RpcController],
  providers: [
    DatabaseService,
    UpdateCheckerService,
    { provide: AppsService, useValue: appsServiceStub },
    { provide: NotificationsService, useValue: notificationsStub },
    { provide: GithubReleasesFetcherService, useValue: githubStub },
    { provide: DockerhubFetcherService, useValue: unusedFetcher },
    { provide: GhcrFetcherService, useValue: unusedFetcher },
    { provide: K8sRegistryFetcherService, useValue: unusedFetcher },
  ],
})
class TestRpcModule {}

let tmpDir: string;
let nest: INestApplication;
let db: DatabaseService;
let baseUrl: string;
let api: ReturnType<typeof createRpcClient<RpcSchema>>;

/** Bypass the client to see exactly what the server puts on the wire. */
async function rawRpc(entity: string, operation: string, params: object) {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity, operation, params }),
  });
  return { status: res.status, body: await res.text() };
}

/** Mirrors what the form sends for a new app: no `id` (the DB assigns it). */
function newApp(overrides: Partial<App> = {}): App {
  return {
    name: "Sonarr",
    category: "Media",
    url: "https://sonarr.local",
    icon: null,
    versionPreferences: null,
    pingPreferences: null,
    appNotificationPreferences: [],
    ...overrides,
  } as App;
}

const versionPrefs = (overrides = {}) =>
  ({
    enabled: true,
    sourceType: "GITHUB_RELEASES",
    sourceRepo: "owner/repo",
    runningEnvironment: "KUBERNETES",
    runningConfig: JSON.stringify({ dockerImage: "x", k8sNamespace: "y" }),
    currentVersion: null,
    latestVersion: null,
    hasUpdate: false,
    versionExtractionRegex: null,
    appId: 0,
    ...overrides,
  }) as NonNullable<App["versionPreferences"]>;

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), "homepage-rpc-"));
  process.env.DATABASE_URL = `file:${join(tmpDir, "test.db")}`;

  execFileSync("bunx", ["prisma", "migrate", "deploy"], {
    env: process.env,
    stdio: "pipe",
  });

  nest = await NestFactory.create(TestRpcModule, { logger: false });
  await nest.listen(0);
  const { port } = nest.getHttpServer().address() as AddressInfo;
  db = nest.get(DatabaseService);
  baseUrl = `http://127.0.0.1:${port}/rpc`;
  api = createRpcClient<RpcSchema>(baseUrl);
}, 60_000);

afterAll(async () => {
  await nest?.close();
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(async () => {
  vi.clearAllMocks();
  appsServiceStub.getRunningVersion.mockResolvedValue(null);
  githubStub.getLatestTag.mockResolvedValue(null);
  await db.app.deleteMany();
});

describe("app RPC", () => {
  it("starts empty", async () => {
    await expect(api.app.getAll({})).resolves.toEqual([]);
    await expect(api.app.getAllCategories({})).resolves.toEqual([]);
  });

  it("creates, lists, fetches and deletes an app", async () => {
    const created = await api.app.create(newApp());
    expect(created).toMatchObject({
      id: expect.any(Number),
      name: "Sonarr",
      category: "Media",
    });

    const all = await api.app.getAll({});
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      name: "Sonarr",
      versionPreferences: null,
      pingPreferences: null,
      appNotificationPreferences: [],
    });

    await expect(api.app.getById({ id: created.id })).resolves.toMatchObject({
      id: created.id,
      url: "https://sonarr.local",
    });

    await api.app.delete({ id: created.id });
    await expect(api.app.getAll({})).resolves.toEqual([]);
  });

  it("persists nested version, ping and notification preferences", async () => {
    // default EMAIL/TELEGRAM channels are created by DatabaseService on init
    {
      const created = await api.app.create(
        newApp({
          versionPreferences: versionPrefs({ enabled: false }),
          pingPreferences: {
            enabled: true,
            url: "https://sonarr.local/ping",
            frequency: 30,
            ignoreSsl: true,
            appId: 0,
          },
          appNotificationPreferences: [
            { appId: 0, channelType: "EMAIL", enabled: false },
          ],
        })
      );

      const fetched = await api.app.getById({ id: created.id });
      expect(fetched?.versionPreferences).toMatchObject({
        sourceRepo: "owner/repo",
        sourceType: "GITHUB_RELEASES",
        appId: created.id,
      });
      expect(fetched?.pingPreferences).toMatchObject({
        url: "https://sonarr.local/ping",
        frequency: 30,
        ignoreSsl: true,
        appId: created.id,
      });
      expect(fetched?.appNotificationPreferences).toEqual([
        { appId: created.id, channelType: "EMAIL", enabled: false },
      ]);
    }
  });

  it("returns sorted distinct categories", async () => {
    await api.app.create(newApp({ name: "b", category: "Tools" }));
    await api.app.create(newApp({ name: "a", category: "Media" }));
    await api.app.create(newApp({ name: "c", category: "Media" }));
    await expect(api.app.getAllCategories({})).resolves.toEqual([
      "Media",
      "Tools",
    ]);
  });

  it("updates scalar fields and upserts nested preferences", async () => {
    const created = await api.app.create(newApp());

    const updated = await api.app.update(
      newApp({
        id: created.id,
        name: "Sonarr 4K",
        category: "Video",
        pingPreferences: {
          enabled: true,
          url: "https://x/ping",
          frequency: 10,
          ignoreSsl: false,
          appId: created.id,
        },
      })
    );
    expect(updated).toMatchObject({ name: "Sonarr 4K", category: "Video" });

    // second update changes the existing ping preference in place
    await api.app.update(
      newApp({
        id: created.id,
        name: "Sonarr 4K",
        category: "Video",
        pingPreferences: {
          enabled: false,
          url: "https://x/ping2",
          frequency: 99,
          ignoreSsl: false,
          appId: created.id,
        },
      })
    );

    const fetched = await api.app.getById({ id: created.id });
    expect(fetched?.pingPreferences).toMatchObject({
      enabled: false,
      url: "https://x/ping2",
      frequency: 99,
    });
    expect(await db.appPingPreference.count()).toBe(1);
  });

  it("deleting an app cascades to its preferences and ping history", async () => {
    const created = await api.app.create(
      newApp({
        versionPreferences: versionPrefs({ enabled: false }),
      })
    );
    await db.pingHistory.create({
      data: {
        appId: created.id,
        status: true,
        responseTime: 5,
        statusCode: 200,
      },
    });

    await api.app.delete({ id: created.id });

    expect(await db.appVersionPreference.count()).toBe(0);
    expect(await db.pingHistory.count()).toBe(0);
  });

  it("enforces unique app names (surfaces as a 500)", async () => {
    await api.app.create(newApp());
    await expect(api.app.create(newApp())).rejects.toThrow();
    await expect(api.app.getAll({})).resolves.toHaveLength(1);
  });

  describe("version checking on create/update", () => {
    it("flags hasUpdate and notifies when upstream is newer than running", async () => {
      appsServiceStub.getRunningVersion.mockResolvedValue("1.0.0");
      githubStub.getLatestTag.mockResolvedValue("v1.2.0");

      const created = await api.app.create(
        newApp({ versionPreferences: versionPrefs() })
      );

      expect(githubStub.getLatestTag).toHaveBeenCalledWith("owner/repo", null);
      const fetched = await api.app.getById({ id: created.id });
      expect(fetched?.versionPreferences).toMatchObject({
        currentVersion: "1.0.0",
        latestVersion: "v1.2.0",
        hasUpdate: true,
      });
      expect(notificationsStub.notifyAppUpdate).toHaveBeenCalledTimes(1);

      // Re-checking does not notify a second time
      await api.app.checkAppUpdates({ id: created.id });
      expect(notificationsStub.notifyAppUpdate).toHaveBeenCalledTimes(1);
    });

    it("clears hasUpdate once the running version catches up", async () => {
      appsServiceStub.getRunningVersion.mockResolvedValue("1.0.0");
      githubStub.getLatestTag.mockResolvedValue("1.2.0");
      const created = await api.app.create(
        newApp({ versionPreferences: versionPrefs() })
      );

      appsServiceStub.getRunningVersion.mockResolvedValue("1.2.0");
      await api.app.checkUpdates({});

      const fetched = await api.app.getById({ id: created.id });
      expect(fetched?.versionPreferences).toMatchObject({
        currentVersion: "1.2.0",
        hasUpdate: false,
      });
    });

    it("does not check apps that have version checking disabled", async () => {
      await api.app.create(
        newApp({ versionPreferences: versionPrefs({ enabled: false }) })
      );
      expect(githubStub.getLatestTag).not.toHaveBeenCalled();
    });
  });

  it("resolveCurrentVersion uses the running-version lookup", async () => {
    const created = await api.app.create(
      newApp({ versionPreferences: versionPrefs({ enabled: false }) })
    );
    appsServiceStub.getRunningVersion.mockResolvedValue("4.5.6");
    const res = await rawRpc("app", "resolveCurrentVersion", {
      id: created.id,
    });
    expect(res).toEqual({ status: 201, body: "4.5.6" });
  });

  // KNOWN QUIRK (server/rpc/rpc.controller.ts): the controller returns the raw
  // handler result and Nest only JSON-encodes objects. Primitive/nullish
  // results go out as non-JSON, which makes the typesafe-rpc client's
  // `response.json()` throw. Locked in as-is; flip these when fixed.
  describe("non-object results (known quirk)", () => {
    it("null results (e.g. getById for a missing app) come back as an empty body", async () => {
      const res = await rawRpc("app", "getById", { id: 999_999 });
      expect(res.body).toBe("");
      await expect(api.app.getById({ id: 999_999 })).rejects.toThrow(
        SyntaxError
      );
    });

    it("string results are sent unquoted", async () => {
      const created = await api.app.create(
        newApp({ versionPreferences: versionPrefs({ enabled: false }) })
      );
      appsServiceStub.getRunningVersion.mockResolvedValue("1.2.3");
      const res = await rawRpc("app", "resolveCurrentVersion", {
        id: created.id,
      });
      expect(res.body).toBe("1.2.3");
    });
  });

  it("paginates ping history newest first and reports the latest status", async () => {
    const created = await api.app.create(newApp());
    for (let i = 0; i < 5; i++) {
      await db.pingHistory.create({
        data: {
          appId: created.id,
          status: i % 2 === 0,
          statusCode: 200 + i,
          createdAt: new Date(Date.UTC(2025, 0, 1, 0, i)),
        },
      });
    }

    const [page, total] = await api.app.getPingHistory({
      appId: created.id,
      pageSize: 2,
      offset: 1,
    });
    expect(total).toBe(5);
    expect(page.map((p) => p.statusCode)).toEqual([203, 202]);

    await expect(
      api.app.getPingStatus({ appId: created.id })
    ).resolves.toMatchObject({ statusCode: 204, status: true });
  });
});

describe("notificationChannel RPC", () => {
  it("lists channels ordered by type (defaults are created on module init)", async () => {
    const channels = await api.notificationChannel.getAll({});
    expect(channels.map((c) => c.channelType)).toEqual(["EMAIL", "TELEGRAM"]);
    expect(channels.every((c) => c.enabled === false)).toBe(true);
  });

  it("updates a channel and reinitializes it with the parsed config", async () => {
    const config = JSON.stringify({ botToken: "t", chatId: "c" });
    const updated = await api.notificationChannel.update({
      channelType: "TELEGRAM",
      enabled: true,
      config,
    });
    expect(updated).toMatchObject({
      channelType: "TELEGRAM",
      enabled: true,
      config,
    });
    expect(notificationsStub.reinitializeChannel).toHaveBeenCalledWith(
      "TELEGRAM",
      { botToken: "t", chatId: "c" }
    );

    await api.notificationChannel.update({
      channelType: "TELEGRAM",
      enabled: false,
      config: "{}",
    });
  });

  it("delegates test requests to the notifications service", async () => {
    notificationsStub.testChannel.mockResolvedValue(undefined);
    const res = await rawRpc("notificationChannel", "test", {
      channelType: "EMAIL",
      config: {},
    });
    expect(res.body).toBe(""); // void result -> empty body (see quirk above)
    expect(notificationsStub.testChannel).toHaveBeenCalledWith("EMAIL", {});
  });
});
