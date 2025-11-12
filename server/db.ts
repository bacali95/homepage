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
    url TEXT NOT NULL,
    github_repo TEXT NOT NULL,
    current_version TEXT NOT NULL,
    latest_version TEXT,
    has_update INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface App {
  id: number;
  name: string;
  url: string;
  github_repo: string;
  current_version: string;
  latest_version: string | null;
  has_update: number;
  created_at: string;
  updated_at: string;
}

export const dbOperations = {
  getAllApps: () => {
    return db.prepare("SELECT * FROM apps ORDER BY name").all() as App[];
  },

  getApp: (id: number) => {
    return db.prepare("SELECT * FROM apps WHERE id = ?").get(id) as
      | App
      | undefined;
  },

  createApp: (
    app: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >
  ) => {
    const stmt = db.prepare(
      "INSERT INTO apps (name, url, github_repo, current_version) VALUES (?, ?, ?, ?)"
    );
    return stmt.run(app.name, app.url, app.github_repo, app.current_version);
  },

  updateApp: (
    id: number,
    app: Partial<Omit<App, "id" | "created_at" | "updated_at">>
  ) => {
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
    if (app.github_repo !== undefined) {
      updates.push("github_repo = ?");
      values.push(app.github_repo);
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
      values.push(app.has_update);
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
};

export default db;
