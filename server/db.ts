import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, "../data/apps.db");
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT,
    repo TEXT NOT NULL,
    source_type TEXT DEFAULT 'github',
    current_version TEXT NOT NULL,
    latest_version TEXT,
    has_update INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    docker_image TEXT NOT NULL,
    k8s_namespace TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export type SourceType = "github" | "ghcr" | "dockerhub" | "k8s";

export interface App {
  id: number;
  name: string;
  url: string | null;
  repo: string;
  source_type: SourceType;
  current_version: string;
  latest_version: string | null;
  has_update: boolean;
  category: string;
  docker_image: string;
  k8s_namespace: string;
  created_at: string;
  updated_at: string;
}

interface DbApp {
  id: number;
  name: string;
  url: string | null;
  repo: string | null;
  source_type: string | null;
  current_version: string;
  latest_version: string | null;
  has_update: number;
  category: string;
  docker_image: string;
  k8s_namespace: string;
  created_at: string;
  updated_at: string;
}

const convertDbAppToApp = (dbApp: DbApp): App => {
  return {
    ...dbApp,
    repo: dbApp.repo || "",
    source_type: (dbApp.source_type || "github") as SourceType,
    has_update: Boolean(dbApp.has_update),
    category: dbApp.category,
    docker_image: dbApp.docker_image,
    k8s_namespace: dbApp.k8s_namespace,
  };
};

export const dbOperations = {
  getAllApps: () => {
    const dbApps = db
      .prepare("SELECT * FROM apps ORDER BY category, name")
      .all() as DbApp[];
    return dbApps.map(convertDbAppToApp);
  },

  getApp: (id: number) => {
    const dbApp = db.prepare("SELECT * FROM apps WHERE id = ?").get(id) as
      | DbApp
      | undefined;
    return dbApp ? convertDbAppToApp(dbApp) : undefined;
  },

  getAppByName: (name: string) => {
    const dbApp = db.prepare("SELECT * FROM apps WHERE name = ?").get(name) as
      | DbApp
      | undefined;
    return dbApp ? convertDbAppToApp(dbApp) : undefined;
  },

  createApp: (
    app: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >
  ) => {
    // Validate required fields
    if (typeof app.category !== "string" || app.category.trim() === "") {
      throw new Error("category is required and must be a non-empty string");
    }
    if (
      typeof app.docker_image !== "string" ||
      app.docker_image.trim() === ""
    ) {
      throw new Error(
        "docker_image is required and must be a non-empty string"
      );
    }
    if (
      typeof app.k8s_namespace !== "string" ||
      app.k8s_namespace.trim() === ""
    ) {
      throw new Error(
        "k8s_namespace is required and must be a non-empty string"
      );
    }

    const stmt = db.prepare(
      "INSERT INTO apps (name, url, repo, source_type, current_version, category, docker_image, k8s_namespace) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    return stmt.run(
      app.name,
      app.url,
      app.repo,
      app.source_type || "github",
      app.current_version,
      app.category,
      app.docker_image,
      app.k8s_namespace
    );
  },

  updateApp: (
    id: number,
    app: Partial<Omit<App, "id" | "created_at" | "updated_at">>
  ) => {
    // Validate required fields if they are being updated
    if (app.category !== undefined) {
      if (typeof app.category !== "string" || app.category.trim() === "") {
        throw new Error("category is required and must be a non-empty string");
      }
    }
    if (app.docker_image !== undefined) {
      if (
        typeof app.docker_image !== "string" ||
        app.docker_image.trim() === ""
      ) {
        throw new Error(
          "docker_image is required and must be a non-empty string"
        );
      }
    }
    if (app.k8s_namespace !== undefined) {
      if (
        typeof app.k8s_namespace !== "string" ||
        app.k8s_namespace.trim() === ""
      ) {
        throw new Error(
          "k8s_namespace is required and must be a non-empty string"
        );
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
      values.push(app.url);
    }
    if (app.repo !== undefined) {
      updates.push("repo = ?");
      values.push(app.repo);
    }
    if (app.source_type !== undefined) {
      updates.push("source_type = ?");
      values.push(app.source_type);
    }
    if (app.current_version !== undefined) {
      updates.push("current_version = ?");
      values.push(app.current_version);
    }
    if (app.latest_version !== undefined) {
      updates.push("latest_version = ?");
      values.push(app.latest_version);
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
      values.push(app.docker_image);
    }
    if (app.k8s_namespace !== undefined) {
      updates.push("k8s_namespace = ?");
      values.push(app.k8s_namespace);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const stmt = db.prepare(
      `UPDATE apps SET ${updates.join(", ")} WHERE id = ?`
    );
    return stmt.run(...values);
  },

  deleteApp: (id: number) => {
    return db.prepare("DELETE FROM apps WHERE id = ?").run(id);
  },

  getCategories: () => {
    const categories = db
      .prepare(
        "SELECT DISTINCT category FROM apps WHERE category != '' ORDER BY category"
      )
      .all() as { category: string }[];
    return categories.map((c) => c.category);
  },
};

export default db;
