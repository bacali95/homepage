import { beforeEach, describe, expect, it, vi } from "vitest";

import type { App } from "../../src/types.js";
import { EmailChannelService } from "./channels/email-channel.service.js";
import { TelegramChannelService } from "./channels/telegram-channel.service.js";
import { NotificationsService } from "./notifications.service.js";

const sendMail = vi.fn();
const createTransport = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTransport: (...args: unknown[]) => createTransport(...args),
  },
}));

const emailConfig = {
  smtpHost: "smtp.test",
  smtpPort: 587,
  security: "auto" as const,
  fromEmail: "from@test",
  toEmail: "to@test",
  smtpUser: "u",
  smtpPassword: "p",
};

const telegramConfig = { botToken: "123:abc", chatId: "42" };

const makeApp = (overrides: Partial<App> = {}): App =>
  ({
    id: 1,
    name: "Sonarr",
    category: "Media",
    url: "https://sonarr.local",
    icon: null,
    versionPreferences: {
      currentVersion: "1.0.0",
      latestVersion: "2.0.0",
    },
    pingPreferences: { url: "https://sonarr.local/ping" },
    appNotificationPreferences: [],
    ...overrides,
  }) as unknown as App;

function setup() {
  const db = {
    notificationChannel: { findMany: vi.fn().mockResolvedValue([]) },
    appNotificationPreference: { findMany: vi.fn().mockResolvedValue([]) },
  };
  const email = new EmailChannelService();
  const telegram = new TelegramChannelService();
  const emailSend = vi.spyOn(email, "send").mockResolvedValue();
  const telegramSend = vi.spyOn(telegram, "send").mockResolvedValue();
  const service = new NotificationsService(db as never, email, telegram);
  return { service, db, email, telegram, emailSend, telegramSend };
}

const channels = (email: boolean, telegram: boolean) => [
  { channelType: "EMAIL", enabled: email, config: "{}" },
  { channelType: "TELEGRAM", enabled: telegram, config: "{}" },
];

describe("NotificationsService.notifyAppUpdate", () => {
  it("sends to every enabled + configured channel with subject and message", async () => {
    const ctx = setup();
    ctx.email.configure(emailConfig);
    ctx.telegram.configure(telegramConfig);
    ctx.db.notificationChannel.findMany.mockResolvedValue(channels(true, true));

    await ctx.service.notifyAppUpdate(makeApp());

    const expectedMessage = [
      "An update is available for Sonarr!",
      "",
      "Current Version: 1.0.0",
      "Latest Version: 2.0.0",
      "",
      "App URL: https://sonarr.local",
    ].join("\n");
    expect(ctx.emailSend).toHaveBeenCalledWith(
      expectedMessage,
      "Update Available: Sonarr"
    );
    expect(ctx.telegramSend).toHaveBeenCalledWith(
      expectedMessage,
      "Update Available: Sonarr"
    );
  });

  it("skips globally disabled channels", async () => {
    const ctx = setup();
    ctx.email.configure(emailConfig);
    ctx.telegram.configure(telegramConfig);
    ctx.db.notificationChannel.findMany.mockResolvedValue(
      channels(false, true)
    );

    await ctx.service.notifyAppUpdate(makeApp());

    expect(ctx.emailSend).not.toHaveBeenCalled();
    expect(ctx.telegramSend).toHaveBeenCalledTimes(1);
  });

  it("skips channels that are enabled but not configured", async () => {
    const ctx = setup();
    ctx.telegram.configure(telegramConfig); // email left unconfigured
    ctx.db.notificationChannel.findMany.mockResolvedValue(channels(true, true));

    await ctx.service.notifyAppUpdate(makeApp());

    expect(ctx.emailSend).not.toHaveBeenCalled();
    expect(ctx.telegramSend).toHaveBeenCalledTimes(1);
  });

  it("honours per-app preferences and defaults to enabled when unset", async () => {
    const ctx = setup();
    ctx.email.configure(emailConfig);
    ctx.telegram.configure(telegramConfig);
    ctx.db.notificationChannel.findMany.mockResolvedValue(channels(true, true));
    ctx.db.appNotificationPreference.findMany.mockResolvedValue([
      { appId: 1, channelType: "EMAIL", enabled: false },
    ]);

    await ctx.service.notifyAppUpdate(makeApp());

    expect(ctx.db.appNotificationPreference.findMany).toHaveBeenCalledWith({
      where: { appId: 1 },
    });
    expect(ctx.emailSend).not.toHaveBeenCalled();
    expect(ctx.telegramSend).toHaveBeenCalledTimes(1);
  });

  it("does not let one failing channel prevent the others or reject", async () => {
    const ctx = setup();
    ctx.email.configure(emailConfig);
    ctx.telegram.configure(telegramConfig);
    ctx.db.notificationChannel.findMany.mockResolvedValue(channels(true, true));
    ctx.emailSend.mockRejectedValue(new Error("smtp down"));

    await expect(
      ctx.service.notifyAppUpdate(makeApp())
    ).resolves.toBeUndefined();
    expect(ctx.telegramSend).toHaveBeenCalledTimes(1);
  });

  it("falls back to Unknown versions and omits an empty URL line", async () => {
    const ctx = setup();
    ctx.telegram.configure(telegramConfig);
    ctx.db.notificationChannel.findMany.mockResolvedValue(
      channels(false, true)
    );

    await ctx.service.notifyAppUpdate(
      makeApp({ url: null, versionPreferences: null })
    );

    expect(ctx.telegramSend).toHaveBeenCalledWith(
      "An update is available for Sonarr!\n\nCurrent Version: Unknown\nLatest Version: Unknown",
      "Update Available: Sonarr"
    );
  });
});

describe("NotificationsService.notifyPingStatusChange", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
    ctx.telegram.configure(telegramConfig);
    ctx.db.notificationChannel.findMany.mockResolvedValue(
      channels(false, true)
    );
  });

  it("formats an UP message with response time and status code", async () => {
    await ctx.service.notifyPingStatusChange(makeApp(), true, 120, 200, null);
    expect(ctx.telegramSend).toHaveBeenCalledWith(
      "Sonarr is now UP!\n\nPing URL: https://sonarr.local/ping\nResponse Time: 120ms\nStatus Code: 200",
      "Sonarr is UP"
    );
  });

  it("formats a DOWN message with status code and error", async () => {
    await ctx.service.notifyPingStatusChange(
      makeApp(),
      false,
      5000,
      503,
      "Service Unavailable"
    );
    expect(ctx.telegramSend).toHaveBeenCalledWith(
      "Sonarr is now DOWN!\n\nPing URL: https://sonarr.local/ping\nStatus Code: 503\nError: Service Unavailable",
      "Sonarr is DOWN"
    );
  });

  it("uses N/A for a missing response time and falls back to the app URL", async () => {
    await ctx.service.notifyPingStatusChange(
      makeApp({ pingPreferences: null }),
      true,
      null,
      null,
      null
    );
    expect(ctx.telegramSend).toHaveBeenCalledWith(
      "Sonarr is now UP!\n\nPing URL: https://sonarr.local\nResponse Time: N/A",
      "Sonarr is UP"
    );
  });

  it("respects per-app disabled channels", async () => {
    ctx.db.appNotificationPreference.findMany.mockResolvedValue([
      { appId: 1, channelType: "TELEGRAM", enabled: false },
    ]);
    await ctx.service.notifyPingStatusChange(makeApp(), false, 1, 500, "x");
    expect(ctx.telegramSend).not.toHaveBeenCalled();
  });
});

describe("NotificationsService channel configuration", () => {
  it("onModuleInit configures only enabled channels from stored JSON", async () => {
    const ctx = setup();
    ctx.db.notificationChannel.findMany.mockResolvedValue([
      {
        channelType: "EMAIL",
        enabled: true,
        config: JSON.stringify(emailConfig),
      },
      {
        channelType: "TELEGRAM",
        enabled: false,
        config: JSON.stringify(telegramConfig),
      },
    ]);

    await ctx.service.onModuleInit();
    expect(ctx.email.isConfigured()).toBe(true);
    expect(ctx.telegram.isConfigured()).toBe(false);
  });

  it("onModuleInit survives invalid stored JSON", async () => {
    const ctx = setup();
    ctx.db.notificationChannel.findMany.mockResolvedValue([
      { channelType: "EMAIL", enabled: true, config: "{not json" },
      {
        channelType: "TELEGRAM",
        enabled: true,
        config: JSON.stringify(telegramConfig),
      },
    ]);
    await ctx.service.onModuleInit();
    expect(ctx.telegram.isConfigured()).toBe(true);
    expect(ctx.email.isConfigured()).toBe(false);
  });

  it("onModuleInit awaits channel loading and propagates DB errors", async () => {
    const ctx = setup();
    let release: (v: unknown[]) => void = () => {};
    ctx.db.notificationChannel.findMany.mockReturnValue(
      new Promise((r) => (release = r))
    );
    let done = false;
    const p = ctx.service.onModuleInit().then(() => (done = true));
    await new Promise((r) => setTimeout(r, 10));
    expect(done).toBe(false);
    release([
      {
        channelType: "EMAIL",
        enabled: true,
        config: JSON.stringify(emailConfig),
      },
    ]);
    await p;
    expect(ctx.email.isConfigured()).toBe(true);

    const failing = setup();
    failing.db.notificationChannel.findMany.mockRejectedValue(
      new Error("db down")
    );
    await expect(failing.service.onModuleInit()).rejects.toThrow("db down");
  });

  it("reinitializeChannel applies the new config to the right channel", async () => {
    const ctx = setup();
    await ctx.service.reinitializeChannel("TELEGRAM", telegramConfig);
    expect(ctx.telegram.isConfigured()).toBe(true);
    expect(ctx.email.isConfigured()).toBe(false);
  });

  describe("testChannel", () => {
    it("configures the channel and sends a test message", async () => {
      const ctx = setup();
      await ctx.service.testChannel("TELEGRAM", telegramConfig);
      expect(ctx.telegramSend).toHaveBeenCalledWith(
        expect.stringContaining("This is a test notification from Homepage!"),
        "Test Notification - TELEGRAM"
      );
      expect(ctx.emailSend).not.toHaveBeenCalled();
    });

    it("rejects when the supplied config is incomplete", async () => {
      const ctx = setup();
      await expect(
        ctx.service.testChannel("EMAIL", { ...emailConfig, smtpHost: "" })
      ).rejects.toThrow("Channel EMAIL is not properly configured");
      expect(ctx.emailSend).not.toHaveBeenCalled();
    });

    it("rejects for unknown channel types", async () => {
      const ctx = setup();
      await expect(
        ctx.service.testChannel("SMS" as never, {} as never)
      ).rejects.toThrow("Channel type SMS not found");
    });

    it("propagates send errors to the caller", async () => {
      const ctx = setup();
      ctx.telegramSend.mockRejectedValue(new Error("401"));
      await expect(
        ctx.service.testChannel("TELEGRAM", telegramConfig)
      ).rejects.toThrow("401");
    });
  });
});

describe("EmailChannelService", () => {
  beforeEach(() => {
    sendMail.mockReset().mockResolvedValue({});
    createTransport.mockReset().mockReturnValue({ sendMail });
  });

  it("is configured only when every required field is present", () => {
    const email = new EmailChannelService();
    expect(email.isConfigured()).toBe(false);
    email.configure(emailConfig);
    expect(email.isConfigured()).toBe(true);
    for (const key of [
      "smtpHost",
      "smtpPort",
      "fromEmail",
      "toEmail",
      "smtpUser",
      "smtpPassword",
    ] as const) {
      email.configure({ ...emailConfig, [key]: "" });
      expect.soft(email.isConfigured(), `missing ${key}`).toBe(false);
    }
  });

  it("does not send when unconfigured", async () => {
    const email = new EmailChannelService();
    await email.send("hi");
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("sends mail with text and <br> html bodies", async () => {
    const email = new EmailChannelService();
    email.configure(emailConfig);
    await email.send("line1\nline2", "Subj");
    expect(sendMail).toHaveBeenCalledWith({
      from: "from@test",
      to: "to@test",
      subject: "Subj",
      text: "line1\nline2",
      html: "line1<br>line2",
    });
  });

  it("uses a default subject", async () => {
    const email = new EmailChannelService();
    email.configure(emailConfig);
    await email.send("x");
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Homepage Update Notification" })
    );
  });

  it.each([
    ["auto", 465, { secure: true, requireTLS: false }],
    ["auto", 587, { secure: false, requireTLS: true }],
    ["auto", 25, { secure: false, requireTLS: true }],
    ["auto", 2525, { secure: false, requireTLS: false }],
    ["tls", 2525, { secure: true, requireTLS: false }],
    ["starttls", 2525, { secure: false, requireTLS: true }],
    ["none", 465, { secure: false, requireTLS: false }],
  ] as const)(
    "security=%s port=%i produces %j",
    async (security, port, expected) => {
      const email = new EmailChannelService();
      email.configure({ ...emailConfig, security, smtpPort: port });
      await email.send("x");
      expect(createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.test",
          port,
          auth: { user: "u", pass: "p" },
          ...expected,
        })
      );
    }
  );

  it("rethrows transport errors", async () => {
    sendMail.mockRejectedValue(new Error("auth failed"));
    const email = new EmailChannelService();
    email.configure(emailConfig);
    await expect(email.send("x")).rejects.toThrow("auth failed");
  });
});

describe("TelegramChannelService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("is configured only with both token and chat id", () => {
    const t = new TelegramChannelService();
    expect(t.isConfigured()).toBe(false);
    t.configure({ botToken: "x", chatId: "" });
    expect(t.isConfigured()).toBe(false);
    t.configure(telegramConfig);
    expect(t.isConfigured()).toBe(true);
  });

  it("posts a Markdown message with a bold subject", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const t = new TelegramChannelService();
    t.configure(telegramConfig);

    await t.send("body", "Subject");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      chat_id: "42",
      text: "*Subject*\n\nbody",
      parse_mode: "Markdown",
    });
  });

  it("sends the bare message when there is no subject", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const t = new TelegramChannelService();
    t.configure(telegramConfig);
    await t.send("body");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).text).toBe("body");
  });

  it("throws with status and API payload on failure", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ description: "Unauthorized" }), {
        status: 401,
      })
    );
    const t = new TelegramChannelService();
    t.configure(telegramConfig);
    await expect(t.send("x")).rejects.toThrow(
      'Telegram API error: 401 - {"description":"Unauthorized"}'
    );
  });

  it("does nothing when unconfigured", async () => {
    const t = new TelegramChannelService();
    await t.send("x");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
