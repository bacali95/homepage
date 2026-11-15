import { EventEmitter } from "events";
import https from "https";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { App } from "../../src/types.js";
import { PingService } from "./ping.service.js";

vi.mock("https", () => ({ default: { request: vi.fn() } }));

function makeApp(
  ping: Partial<NonNullable<App["pingPreferences"]>> | null = {},
  id = 1
): App {
  return {
    id,
    name: `app-${id}`,
    category: "Media",
    url: "http://app.local",
    icon: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    versionPreferences: null,
    appNotificationPreferences: [],
    pingPreferences:
      ping === null
        ? null
        : {
            enabled: true,
            url: "http://app.local/health",
            frequency: 60,
            ignoreSsl: false,
            appId: id,
            ...ping,
          },
  } as App;
}

function setup() {
  const db = {
    app: { findMany: vi.fn() },
    pingHistory: {
      create: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
      deleteMany: vi.fn(),
    },
  };
  const notifications = { notifyPingStatusChange: vi.fn() };
  const service = new PingService(db as never, notifications as never);
  return { service, db, notifications };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("PingService.pingApp", () => {
  it("does nothing when ping is disabled or not configured", async () => {
    const { service, db } = setup();
    await service.pingApp(makeApp({ enabled: false }));
    await service.pingApp(makeApp(null));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.pingHistory.create).not.toHaveBeenCalled();
  });

  it("records an UP result for a 2xx response", async () => {
    const { service, db } = setup();
    fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));

    await service.pingApp(makeApp());

    expect(fetchMock).toHaveBeenCalledWith(
      "http://app.local/health",
      expect.objectContaining({
        method: "GET",
        headers: { "User-Agent": "Homepage-Ping/1.0" },
      })
    );
    expect(db.pingHistory.create).toHaveBeenCalledWith({
      data: {
        appId: 1,
        status: true,
        responseTime: expect.any(Number),
        statusCode: 200,
        errorMessage: null,
      },
    });
  });

  it("records a DOWN result with status code for non-2xx responses", async () => {
    const { service, db } = setup();
    fetchMock.mockResolvedValue(new Response("err", { status: 503 }));

    await service.pingApp(makeApp());

    expect(db.pingHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: false,
        statusCode: 503,
        errorMessage: null,
      }),
    });
  });

  it("records a DOWN result with the error message when the request fails", async () => {
    const { service, db } = setup();
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await service.pingApp(makeApp());

    expect(db.pingHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: false,
        statusCode: null,
        errorMessage: "ECONNREFUSED",
      }),
    });
  });

  it("silently drops aborted pings (nothing stored, no notification)", async () => {
    const { service, db, notifications } = setup();
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetchMock.mockRejectedValue(abort);

    await service.pingApp(makeApp());

    expect(db.pingHistory.create).not.toHaveBeenCalled();
    expect(notifications.notifyPingStatusChange).not.toHaveBeenCalled();
  });

  it("aborts the request after 10 seconds", async () => {
    vi.useFakeTimers();
    const { service, db } = setup();
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const e = new Error("The operation was aborted");
            e.name = "AbortError";
            reject(e);
          });
        })
    );

    const promise = service.pingApp(makeApp());
    await vi.advanceTimersByTimeAsync(10_000);
    await promise;

    expect(db.pingHistory.create).not.toHaveBeenCalled();
  });

  describe("status change notifications", () => {
    it("does not notify on the first ping of an app", async () => {
      const { service, notifications } = setup();
      fetchMock.mockResolvedValue(new Response("", { status: 500 }));
      await service.pingApp(makeApp());
      expect(notifications.notifyPingStatusChange).not.toHaveBeenCalled();
    });

    it("notifies only when status flips, and not when it stays the same", async () => {
      const { service, notifications } = setup();
      const app = makeApp();

      fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));
      await service.pingApp(app); // UP (first, no notification)
      fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));
      await service.pingApp(app); // UP -> UP
      expect(notifications.notifyPingStatusChange).not.toHaveBeenCalled();

      fetchMock.mockResolvedValueOnce(new Response("", { status: 502 }));
      await service.pingApp(app); // UP -> DOWN
      expect(notifications.notifyPingStatusChange).toHaveBeenCalledTimes(1);
      expect(notifications.notifyPingStatusChange).toHaveBeenLastCalledWith(
        app,
        false,
        expect.any(Number),
        502,
        null
      );

      fetchMock.mockResolvedValueOnce(new Response("", { status: 502 }));
      await service.pingApp(app); // DOWN -> DOWN
      expect(notifications.notifyPingStatusChange).toHaveBeenCalledTimes(1);

      fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));
      await service.pingApp(app); // DOWN -> UP
      expect(notifications.notifyPingStatusChange).toHaveBeenCalledTimes(2);
      expect(notifications.notifyPingStatusChange).toHaveBeenLastCalledWith(
        app,
        true,
        expect.any(Number),
        200,
        null
      );
    });

    it("tracks status per app", async () => {
      const { service, notifications } = setup();
      fetchMock.mockResolvedValueOnce(new Response("", { status: 200 }));
      await service.pingApp(makeApp({}, 1));
      fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
      await service.pingApp(makeApp({}, 2));
      expect(notifications.notifyPingStatusChange).not.toHaveBeenCalled();
    });
  });

  describe("ignoreSsl", () => {
    function mockHttpsResponse(statusCode: number) {
      vi.mocked(https.request).mockImplementation(((
        _options: unknown,
        cb: (res: EventEmitter & { statusCode: number }) => void
      ) => {
        const req = Object.assign(new EventEmitter(), {
          destroy: vi.fn(),
          end: () => {
            const res = Object.assign(new EventEmitter(), { statusCode });
            cb(res);
            res.emit("data", Buffer.from("x"));
            res.emit("end");
          },
        });
        return req;
      }) as never);
    }

    it("uses https.request with rejectUnauthorized=false for https URLs", async () => {
      const { service, db } = setup();
      mockHttpsResponse(200);

      await service.pingApp(
        makeApp({
          url: "https://self-signed.local:8443/a?b=1",
          ignoreSsl: true,
        })
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(https.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: "self-signed.local",
          port: "8443",
          path: "/a?b=1",
          rejectUnauthorized: false,
        }),
        expect.any(Function)
      );
      expect(db.pingHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: true, statusCode: 200 }),
      });
    });

    it("treats non-2xx from the https path as DOWN", async () => {
      const { service, db } = setup();
      mockHttpsResponse(404);
      await service.pingApp(
        makeApp({ url: "https://x.local", ignoreSsl: true })
      );
      expect(db.pingHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: false, statusCode: 404 }),
      });
    });

    it("falls back to fetch for plain http URLs", async () => {
      const { service } = setup();
      fetchMock.mockResolvedValue(new Response("", { status: 200 }));
      await service.pingApp(
        makeApp({ url: "http://x.local", ignoreSsl: true })
      );
      expect(fetchMock).toHaveBeenCalled();
      expect(https.request).not.toHaveBeenCalled();
    });
  });
});

describe("PingService.pingAllApps", () => {
  it("only queries apps with ping enabled and pings them all, tolerating failures", async () => {
    const { service, db } = setup();
    db.app.findMany.mockResolvedValue([makeApp({}, 1), makeApp({}, 2)]);
    fetchMock
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce(new Response("", { status: 200 }));

    await service.pingAllApps();

    expect(db.app.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { pingPreferences: { enabled: true } } })
    );
    expect(db.pingHistory.create).toHaveBeenCalledTimes(2);
  });

  it("seeds the status cache from history so the first flip notifies", async () => {
    const { service, db, notifications } = setup();
    db.app.findMany.mockResolvedValue([makeApp({}, 1)]);
    db.pingHistory.findFirst.mockResolvedValue({ status: true });
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));

    await service.pingAllApps();

    expect(notifications.notifyPingStatusChange).toHaveBeenCalledTimes(1);
  });
});

describe("PingService.getAppStatus", () => {
  it("falls back to the latest history row and caches it", async () => {
    const { service, db } = setup();
    db.pingHistory.findFirst.mockResolvedValue({ status: false });
    await expect(service.getAppStatus(1)).resolves.toBe(false);
    await expect(service.getAppStatus(1)).resolves.toBe(false);
    expect(db.pingHistory.findFirst).toHaveBeenCalledTimes(1);
  });

  it("returns null when never pinged", async () => {
    const { service } = setup();
    await expect(service.getAppStatus(99)).resolves.toBeNull();
  });
});

describe("PingService.cleanupOldPingHistory", () => {
  it("deletes rows older than the cutoff (default 7 days) and returns the count", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
    const { service, db } = setup();
    db.pingHistory.deleteMany.mockResolvedValue({ count: 5 });

    await expect(service.cleanupOldPingHistory()).resolves.toBe(5);

    const cutoff = db.pingHistory.deleteMany.mock.calls[0][0].where.createdAt
      .lt as Date;
    expect(cutoff.toISOString()).toBe(
      new Date("2025-01-08T12:00:00Z").toISOString()
    );
  });

  it("accepts a custom retention period", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
    const { service, db } = setup();
    db.pingHistory.deleteMany.mockResolvedValue({ count: 0 });
    await service.cleanupOldPingHistory(1);
    const cutoff = db.pingHistory.deleteMany.mock.calls[0][0].where.createdAt
      .lt as Date;
    expect(cutoff.toISOString()).toBe(
      new Date("2025-01-14T12:00:00Z").toISOString()
    );
  });
});
