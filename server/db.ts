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
    github_repo TEXT NOT NULL,
    current_version TEXT NOT NULL,
    latest_version TEXT,
    has_update INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add source_type column if it doesn't exist (migration)
try {
  db.exec(`ALTER TABLE apps ADD COLUMN source_type TEXT DEFAULT 'github'`);
  // Migrate existing 'github' to 'ghcr' if they were using container registry
  // We'll keep 'github' for releases and use 'ghcr' for container registry
} catch (error) {
  // Column already exists, ignore
}

// Add repo column if it doesn't exist (for backward compatibility)
try {
  db.exec(`ALTER TABLE apps ADD COLUMN repo TEXT`);
  // Migrate existing github_repo to repo
  db.exec(`UPDATE apps SET repo = github_repo WHERE repo IS NULL`);
} catch (error) {
  // Column already exists, ignore
}

// Add category column if it doesn't exist
try {
  db.exec(`ALTER TABLE apps ADD COLUMN category TEXT`);
} catch (error) {
  // Column already exists, ignore
}

// Make url column nullable (migration for services without URLs)
try {
  // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
  // But since we're using migrations, we'll just ensure new inserts can have NULL urls
  // The schema will be updated on next table creation, but existing data is fine
  // We'll handle NULL urls in the application code
} catch (error) {
  // Ignore
}

export type SourceType = "github" | "ghcr" | "dockerhub" | "k8s";

export interface App {
  id: number;
  name: string;
  url: string | null;
  github_repo: string; // Keep for backward compatibility
  repo: string;
  source_type: SourceType;
  current_version: string;
  latest_version: string | null;
  has_update: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface DbApp {
  id: number;
  name: string;
  url: string | null;
  github_repo: string | null;
  repo: string | null;
  source_type: string | null;
  current_version: string;
  latest_version: string | null;
  has_update: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

const convertDbAppToApp = (dbApp: DbApp): App => {
  // Migrate old 'github' to 'ghcr' if needed (backward compatibility)
  let sourceType = dbApp.source_type || "github";
  // If source_type is 'github' but we want to distinguish, we'll use 'github' for releases
  // and 'ghcr' for container registry. For now, keep 'github' as default for releases.

  return {
    ...dbApp,
    repo: dbApp.repo || dbApp.github_repo || "",
    source_type: sourceType as SourceType,
    github_repo: dbApp.github_repo || dbApp.repo || "", // Backward compatibility
    has_update: Boolean(dbApp.has_update),
    category: dbApp.category || null,
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

  createApp: (
    app: Omit<
      App,
      "id" | "created_at" | "updated_at" | "latest_version" | "has_update"
    >
  ) => {
    const stmt = db.prepare(
      "INSERT INTO apps (name, url, github_repo, repo, source_type, current_version, category) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const repo = app.repo || app.github_repo || "";
    return stmt.run(
      app.name,
      app.url,
      repo, // github_repo for backward compatibility
      repo,
      app.source_type || "github",
      app.current_version,
      app.category || null
    );
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
    if (app.repo !== undefined || app.github_repo !== undefined) {
      const repo = app.repo || app.github_repo || "";
      updates.push("repo = ?");
      values.push(repo);
      updates.push("github_repo = ?");
      values.push(repo);
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
      values.push(app.category || null);
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
        "SELECT DISTINCT category FROM apps WHERE category IS NOT NULL AND category != '' ORDER BY category"
      )
      .all() as { category: string }[];
    return categories.map((c) => c.category);
  },
};

export default db;
