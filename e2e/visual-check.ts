// Seeds a throwaway DB, boots the production build and saves screenshots to
// .e2e/screens. Run after `bun run build`: bun e2e/visual-check.ts
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import { PrismaLibSql } from "@prisma/adapter-libsql";

import {
  PrismaClient,
  RunningEnvironment,
  SourceType,
} from "../generated/client/client.js";

const PORT = 3112;
const DB = ".e2e/visual/visual.db";
const OUT = ".e2e/screens";
const env = {
  ...process.env,
  NODE_ENV: "production",
  PORT: String(PORT),
  DATABASE_URL: `file:./${DB}`,
};

const icon = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#f59e0b"/><path d="M7 12l3 3 7-7" stroke="#fff" stroke-width="2.5" fill="none"/></svg>`
)}`;

const version = (
  current: string,
  latest: string | null,
  ns: string,
  image: string
) => ({
  enabled: true,
  sourceType: SourceType.GITHUB_RELEASES,
  sourceRepo: "owner/repo",
  runningEnvironment: RunningEnvironment.KUBERNETES,
  runningConfig: JSON.stringify({ dockerImage: image, k8sNamespace: ns }),
  currentVersion: current,
  latestVersion: latest,
  hasUpdate: latest !== null && latest !== current,
  versionExtractionRegex: null,
});

const ping = (url: string) => ({
  enabled: true,
  url,
  frequency: 1440,
  ignoreSsl: false,
});

const seeds = [
  {
    name: "Jellyfin",
    category: "Media",
    url: "https://jellyfin.home.lab",
    icon,
    versionPreferences: version("10.9.11", null, "media", "jellyfin/jellyfin"),
    pingPreferences: ping(`http://localhost:${PORT}/healthz`),
    pattern: "up",
  },
  {
    name: "Sonarr",
    category: "Media",
    url: "https://sonarr.home.lab",
    versionPreferences: version(
      "4.0.9",
      "4.0.10",
      "media",
      "linuxserver/sonarr"
    ),
    pingPreferences: ping(`http://localhost:${PORT}/healthz`),
    pattern: "slow",
  },
  {
    name: "Radarr",
    category: "Media",
    url: "https://radarr.home.lab",
    pattern: "none",
  },
  {
    name: "Proxmox",
    category: "Infrastructure",
    url: "https://pve.home.lab:8006",
    pingPreferences: ping(`http://localhost:${PORT}/healthz`),
    pattern: "up",
  },
  {
    name: "Traefik",
    category: "Infrastructure",
    url: "https://traefik.home.lab",
    versionPreferences: version("v3.1.2", null, "kube-system", "traefik"),
    pingPreferences: ping(`http://localhost:${PORT}/healthz`),
    pattern: "up",
  },
  {
    name: "Grafana",
    category: "Infrastructure",
    url: "https://grafana.home.lab",
    versionPreferences: version(
      "11.1.0",
      "11.2.0",
      "monitoring",
      "grafana/grafana-oss"
    ),
    pingPreferences: ping("http://localhost:9/"),
    pattern: "down",
  },
  {
    name: "Vaultwarden",
    category: "Tools",
    url: "https://vault.home.lab",
    pingPreferences: ping(`http://localhost:${PORT}/healthz`),
    pattern: "up",
  },
  {
    name: "Paperless-ngx with a very long name to test truncation",
    category: "Tools",
    versionPreferences: version(
      "2.11.0",
      null,
      "documents",
      "ghcr.io/paperless-ngx/paperless-ngx"
    ),
    pattern: "none",
  },
] as const;

const patterns = new Map<number, string>();
const versions = new Map<number, ReturnType<typeof version>>();

async function seed() {
  rmSync(".e2e/visual", { recursive: true, force: true });
  mkdirSync(".e2e/visual", { recursive: true });
  execFileSync("bunx", ["prisma", "migrate", "deploy"], { env, stdio: "pipe" });
  const prisma = new PrismaClient({
    adapter: new PrismaLibSql({ url: env.DATABASE_URL }),
  });
  for (const seedApp of seeds) {
    const { pattern, versionPreferences, pingPreferences, ...data } =
      seedApp as (typeof seeds)[number] & {
        versionPreferences?: ReturnType<typeof version>;
        pingPreferences?: ReturnType<typeof ping>;
      };
    const app = await prisma.app.create({
      data: {
        ...data,
        versionPreferences: versionPreferences
          ? { create: versionPreferences }
          : undefined,
        pingPreferences: pingPreferences
          ? { create: pingPreferences }
          : undefined,
      },
    });
    patterns.set(app.id, pattern);
    if (versionPreferences) versions.set(app.id, versionPreferences);
  }
  await prisma.$disconnect();
}

// The server pings once at boot, so history goes in after it has started.
async function seedHistory() {
  const prisma = new PrismaClient({
    adapter: new PrismaLibSql({ url: env.DATABASE_URL }),
  });
  for (const [appId, prefs] of versions) {
    await prisma.appVersionPreference.update({
      where: { appId },
      data: {
        currentVersion: prefs.currentVersion,
        latestVersion: prefs.latestVersion,
        hasUpdate: prefs.hasUpdate,
      },
    });
  }
  await prisma.pingHistory.deleteMany();
  for (const [appId, pattern] of patterns) {
    if (pattern === "none") continue;
    for (let i = 0; i < 30; i++) {
      const down = pattern === "down" && (i < 3 || i === 9 || i === 10);
      const slow = pattern === "slow" && (i % 7 === 2 || i === 0);
      await prisma.pingHistory.create({
        data: {
          appId,
          status: !down,
          responseTime: down ? null : slow ? 900 + i * 7 : 24 + ((i * 13) % 40),
          statusCode: down ? null : 200,
          errorMessage: down ? "connect ECONNREFUSED" : null,
          createdAt: new Date(Date.now() - i * 5 * 60_000),
        },
      });
    }
  }
  await prisma.$disconnect();
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/healthz`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}

const settle = (page: Page) => page.waitForTimeout(500);

async function main() {
  await seed();
  mkdirSync(OUT, { recursive: true });
  const server = spawn("bun", ["--bun", "./dist-server/server/main.js"], {
    env,
    stdio: "ignore",
  });
  try {
    await waitForServer();
    await new Promise((r) => setTimeout(r, 3000));
    await seedHistory();
    const browser = await chromium.launch();
    const shot = async (
      name: string,
      theme: "dark" | "light",
      width: number,
      height: number,
      run: (page: Page) => Promise<void>,
      fullPage = false
    ) => {
      const context = await browser.newContext({
        viewport: { width, height },
        colorScheme: theme,
        deviceScaleFactor: 1,
      });
      await context.addInitScript(
        (t) => localStorage.setItem("theme", t),
        theme
      );
      const page = await context.newPage();
      await page.goto(`http://localhost:${PORT}/`);
      await page.getByRole("heading", { level: 2, name: "Media" }).waitFor();
      await run(page);
      await settle(page);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
      await context.close();
    };
    const nothing = async () => {};

    await shot("home-dark-1440", "dark", 1440, 900, nothing, true);
    await shot("home-light-1440", "light", 1440, 900, nothing, true);
    await shot("home-dark-375", "dark", 375, 812, nothing, true);
    await shot("home-light-375", "light", 375, 812, nothing, true);
    await shot("palette-dark", "dark", 1440, 900, async (page) => {
      await page.keyboard.press("ControlOrMeta+k");
      await page.getByRole("combobox", { name: "Search commands" }).fill("gr");
    });
    await shot("delete-dialog-dark", "dark", 1440, 900, async (page) => {
      await page.getByRole("button", { name: "Actions for Radarr" }).click();
      await page.getByRole("menuitem", { name: "Delete" }).click();
    });
    await shot("menu-dark", "dark", 1440, 900, async (page) => {
      await page.getByRole("button", { name: "Actions for Sonarr" }).click();
    });
    await shot("ping-history-dark", "dark", 1440, 900, async (page) => {
      await page
        .getByRole("button", { name: /ping history for Grafana/ })
        .click();
      await page.getByText("Showing").waitFor();
      await page.waitForTimeout(400);
    });
    await shot("form-dark", "dark", 1440, 900, async (page) => {
      await page.goto(`http://localhost:${PORT}/2`);
      await page.getByLabel("App name").waitFor();
    });
    await shot("form-version-dark", "dark", 1440, 900, async (page) => {
      await page.goto(`http://localhost:${PORT}/2/version`);
      await page.getByLabel("Docker image").waitFor();
    });
    await shot("form-dark-375", "dark", 375, 812, async (page) => {
      await page.goto(`http://localhost:${PORT}/2/ping`);
      await page.getByLabel("Ping URL").waitFor();
    });
    await shot("settings-dark", "dark", 1440, 900, async (page) => {
      await page.goto(`http://localhost:${PORT}/settings`);
      await page.getByText("Appearance").waitFor();
    });
    await shot(
      "settings-notifications-dark",
      "dark",
      1440,
      900,
      async (page) => {
        await page.goto(`http://localhost:${PORT}/settings/notifications`);
        await page.getByRole("button", { name: /Email/ }).click();
      }
    );
    await shot("settings-light", "light", 1440, 900, async (page) => {
      await page.goto(`http://localhost:${PORT}/settings`);
      await page.getByText("Appearance").waitFor();
    });
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
