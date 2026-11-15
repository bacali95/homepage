import { Injectable, Logger, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import { DatabaseService } from "./database.service.js";

process.env.DATABASE_URL ??= "file:./unused-test.db";

function makeService() {
  const service = new DatabaseService();
  const findMany = vi.fn();
  const create = vi.fn().mockResolvedValue({});
  Object.defineProperty(service, "notificationChannel", {
    value: { findMany, create },
  });
  return { service, findMany, create };
}

describe("DatabaseService.onModuleInit", () => {
  it("awaits default channel creation before resolving", async () => {
    const { service, findMany, create } = makeService();
    let releaseCreate: () => void = () => {};
    findMany.mockResolvedValue([]);
    create.mockImplementation(
      () => new Promise<void>((resolve) => (releaseCreate = resolve))
    );

    let done = false;
    const p = service.onModuleInit().then(() => (done = true));
    await new Promise((r) => setTimeout(r, 10));
    expect(done).toBe(false);
    expect(create).toHaveBeenCalledTimes(1);
    releaseCreate();
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    releaseCreate();
    await p;
    expect(done).toBe(true);
    expect(create.mock.calls.map((c) => c[0].data.channelType)).toEqual([
      "EMAIL",
      "TELEGRAM",
    ]);
  });

  it("only creates missing channels", async () => {
    const { service, findMany, create } = makeService();
    findMany.mockResolvedValue([{ channelType: "EMAIL" }]);
    await service.onModuleInit();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data.channelType).toBe("TELEGRAM");
  });

  it("propagates database errors instead of swallowing them", async () => {
    const { service, findMany } = makeService();
    findMany.mockRejectedValue(new Error("no such table"));
    await expect(service.onModuleInit()).rejects.toThrow("no such table");
  });
});

describe("Nest lifecycle ordering", () => {
  it("DatabaseModule init completes before NotificationsModule init runs", async () => {
    const events: string[] = [];

    @Injectable()
    class Db {
      async onModuleInit() {
        events.push("db:start");
        await new Promise((r) => setTimeout(r, 30));
        events.push("db:done");
      }
    }
    @Module({ providers: [Db], exports: [Db] })
    class DbModule {}

    @Injectable()
    class Notif {
      async onModuleInit() {
        events.push("notif:start");
      }
    }
    @Module({ imports: [DbModule], providers: [Notif] })
    class NotifModule {}

    @Module({ imports: [DbModule, NotifModule] })
    class Root {}

    const app = await NestFactory.createApplicationContext(Root, {
      logger: false,
    });
    await app.close();
    expect(events).toEqual(["db:start", "db:done", "notif:start"]);
  });

  it("a failing init hook rejects application bootstrap", async () => {
    vi.spyOn(Logger, "error").mockImplementation(() => {});

    @Injectable()
    class Boom {
      async onModuleInit() {
        throw new Error("init failed");
      }
    }
    @Module({ providers: [Boom] })
    class Root {}

    await expect(
      NestFactory.createApplicationContext(Root, {
        logger: false,
        abortOnError: false,
      })
    ).rejects.toThrow("init failed");
  });
});
