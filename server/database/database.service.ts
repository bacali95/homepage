import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Injectable, OnModuleInit } from "@nestjs/common";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type SourceType = "github" | "ghcr" | "dockerhub" | "k8s";

export interface App {
  id: number;
  name: string;
  url: string | null;
  repo: string | null;
  source_type: SourceType | null;
  current_version: string | null;
  latest_version: string | null;
  has_update: boolean;
  category: string;
  docker_image: string | null;
  k8s_namespace: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

interface DbApp {
  id: number;
  name: string;
  url: string | null;
  repo: string | null;
  source_type: string | null;
  current_version: string | null;
  latest_version: string | null;
  has_update: number;
  category: string;
  docker_image: string | null;
  k8s_namespace: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

const convertDbAppToApp = (dbApp: DbApp): App => {
  return {
    ...dbApp,
    repo: dbApp.repo || null,
    source_type: (dbApp.source_type || null) as SourceType | null,
    has_update: Boolean(dbApp.has_update),
    category: dbApp.category,
    docker_image: dbApp.docker_image || null,
    k8s_namespace: dbApp.k8s_namespace || null,
    icon: dbApp.icon || null,
    current_version: dbApp.current_version || null,
  };
};

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database.Database;

  onModuleInit() {
    const dbPath = path.join(__dirname, "../../data/apps.db");
    this.db = new Database(dbPath);

    // Initialize database schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS apps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT,
        repo TEXT,
        source_type TEXT,
        current_version TEXT,
        latest_version TEXT,
        has_update INTEGER DEFAULT 0,
        category TEXT NOT NULL,
        docker_image TEXT,
        k8s_namespace TEXT,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add icon column if it doesn't exist
    try {
      this.db.exec("ALTER TABLE apps ADD COLUMN icon TEXT");
    } catch {
      // Column likely already exists
    }

    // Notification channels table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_type TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 0,
        config TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // App notification preferences table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_notification_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id INTEGER NOT NULL,
        channel_type TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
        UNIQUE(app_id, channel_type)
      )
    `);

    // Initialize default channels if they don't exist
    const existingChannels = this.db
      .prepare("SELECT channel_type FROM notification_channels")
      .all() as { channel_type: string }[];
    const existingChannelTypes = existingChannels.map((c) => c.channel_type);

    if (!existingChannelTypes.includes("email")) {
      this.db
        .prepare(
          "INSERT INTO notification_channels (channel_type, enabled, config) VALUES (?, ?, ?)"
        )
        .run("email", 0, JSON.stringify({}));
    }
    if (!existingChannelTypes.includes("telegram")) {
      this.db
        .prepare(
          "INSERT INTO notification_channels (channel_type, enabled, config) VALUES (?, ?, ?)"
        )
        .run("telegram", 0, JSON.stringify({}));
    }
  }

  getAllApps(): App[] {
    const dbApps = this.db
      .prepare("SELECT * FROM apps ORDER BY category, name")
      .all() as DbApp[];
    return dbApps.map(convertDbAppToApp);
  }

  getApp(id: number): App | undefined {
    const dbApp = this.db.prepare("SELECT * FROM apps WHERE id = ?").get(id) as
      | DbApp
      | undefined;
    return dbApp ? convertDbAppToApp(dbApp) : undefined;
  }

  getAppByName(name: string): App | undefined {
    const dbApp = this.db
      .prepare("SELECT * FROM apps WHERE name = ?")
      .get(name) as DbApp | undefined;
    return dbApp ? convertDbAppToApp(dbApp) : undefined;
  }

  createApp(
    app: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >
  ) {
    // Validate required fields
    if (typeof app.category !== "string" || app.category.trim() === "") {
      throw new Error("category is required and must be a non-empty string");
    }

    const stmt = this.db.prepare(
      "INSERT INTO apps (name, url, repo, source_type, current_version, category, docker_image, k8s_namespace, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    return stmt.run(
      app.name,
      app.url || null,
      app.repo || null,
      app.source_type || null,
      app.current_version || null,
      app.category,
      app.docker_image || null,
      app.k8s_namespace || null,
      app.icon || null
    );
  }

  updateApp(
    id: number,
    app: Partial<Omit<App, "id" | "created_at" | "updated_at">>
  ) {
    // Validate required fields if they are being updated
    if (app.category !== undefined) {
      if (typeof app.category !== "string" || app.category.trim() === "") {
        throw new Error("category is required and must be a non-empty string");
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (app.name !== undefined) {
      updates.push("name = ?");
      values.push(app.name);
    }
    if (app.url !== undefined) {
      updates.push("url = ?");
      values.push(app.url || null);
    }
    if (app.repo !== undefined) {
      updates.push("repo = ?");
      values.push(app.repo || null);
    }
    if (app.source_type !== undefined) {
      updates.push("source_type = ?");
      values.push(app.source_type || null);
    }
    if (app.current_version !== undefined) {
      updates.push("current_version = ?");
      values.push(app.current_version || null);
    }
    if (app.latest_version !== undefined) {
      updates.push("latest_version = ?");
      values.push(app.latest_version || null);
    }
    if (app.has_update !== undefined) {
      updates.push("has_update = ?");
      values.push(app.has_update ? 1 : 0);
    }
    if (app.category !== undefined) {
      updates.push("category = ?");
      values.push(app.category);
    }
    if (app.docker_image !== undefined) {
      updates.push("docker_image = ?");
      values.push(app.docker_image || null);
    }
    if (app.k8s_namespace !== undefined) {
      updates.push("k8s_namespace = ?");
      values.push(app.k8s_namespace || null);
    }
    if (app.icon !== undefined) {
      updates.push("icon = ?");
      values.push(app.icon || null);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE apps SET ${updates.join(", ")} WHERE id = ?`
    );
    return stmt.run(...values);
  }

  deleteApp(id: number) {
    return this.db.prepare("DELETE FROM apps WHERE id = ?").run(id);
  }

  getCategories(): string[] {
    const categories = this.db
      .prepare(
        "SELECT DISTINCT category FROM apps WHERE category != '' ORDER BY category"
      )
      .all() as { category: string }[];
    return categories.map((c) => c.category);
  }

  // Notification methods
  getNotificationChannels() {
    return this.db
      .prepare("SELECT * FROM notification_channels ORDER BY channel_type")
      .all() as Array<{
      id: number;
      channel_type: string;
      enabled: number;
      config: string;
      created_at: string;
      updated_at: string;
    }>;
  }

  getNotificationChannel(channelType: string) {
    return this.db
      .prepare("SELECT * FROM notification_channels WHERE channel_type = ?")
      .get(channelType) as
      | {
          id: number;
          channel_type: string;
          enabled: number;
          config: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;
  }

  updateNotificationChannel(
    channelType: string,
    updates: { enabled?: boolean; config?: Record<string, any> }
  ) {
    const updatesList: string[] = [];
    const values: any[] = [];

    if (updates.enabled !== undefined) {
      updatesList.push("enabled = ?");
      values.push(updates.enabled ? 1 : 0);
    }
    if (updates.config !== undefined) {
      updatesList.push("config = ?");
      values.push(JSON.stringify(updates.config));
    }

    updatesList.push("updated_at = CURRENT_TIMESTAMP");
    values.push(channelType);

    const stmt = this.db.prepare(
      `UPDATE notification_channels SET ${updatesList.join(
        ", "
      )} WHERE channel_type = ?`
    );
    return stmt.run(...values);
  }

  getAppNotificationPreferences(appId: number) {
    return this.db
      .prepare("SELECT * FROM app_notification_preferences WHERE app_id = ?")
      .all(appId) as Array<{
      id: number;
      app_id: number;
      channel_type: string;
      enabled: number;
    }>;
  }

  getAppNotificationPreference(appId: number, channelType: string) {
    return this.db
      .prepare(
        "SELECT * FROM app_notification_preferences WHERE app_id = ? AND channel_type = ?"
      )
      .get(appId, channelType) as
      | {
          id: number;
          app_id: number;
          channel_type: string;
          enabled: number;
        }
      | undefined;
  }

  setAppNotificationPreference(
    appId: number,
    channelType: string,
    enabled: boolean
  ) {
    const existing = this.getAppNotificationPreference(appId, channelType);
    if (existing) {
      return this.db
        .prepare(
          "UPDATE app_notification_preferences SET enabled = ? WHERE app_id = ? AND channel_type = ?"
        )
        .run(enabled ? 1 : 0, appId, channelType);
    } else {
      return this.db
        .prepare(
          "INSERT INTO app_notification_preferences (app_id, channel_type, enabled) VALUES (?, ?, ?)"
        )
        .run(appId, channelType, enabled ? 1 : 0);
    }
  }

  deleteAppNotificationPreferences(appId: number) {
    return this.db
      .prepare("DELETE FROM app_notification_preferences WHERE app_id = ?")
      .run(appId);
  }
}
