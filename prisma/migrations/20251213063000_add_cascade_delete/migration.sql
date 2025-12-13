-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppPingPreference" (
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "ignoreSsl" BOOLEAN NOT NULL DEFAULT false,
    "appId" INTEGER NOT NULL,
    CONSTRAINT "AppPingPreference_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AppPingPreference" ("appId", "enabled", "frequency", "ignoreSsl", "url") SELECT "appId", "enabled", "frequency", "ignoreSsl", "url" FROM "AppPingPreference";
DROP TABLE "AppPingPreference";
ALTER TABLE "new_AppPingPreference" RENAME TO "AppPingPreference";
CREATE UNIQUE INDEX "AppPingPreference_appId_key" ON "AppPingPreference"("appId");
CREATE TABLE "new_AppVersionPreference" (
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sourceType" TEXT NOT NULL,
    "sourceRepo" TEXT NOT NULL,
    "runningEnvironment" TEXT NOT NULL,
    "runningConfig" TEXT NOT NULL,
    "currentVersion" TEXT,
    "latestVersion" TEXT,
    "hasUpdate" BOOLEAN NOT NULL DEFAULT false,
    "appId" INTEGER NOT NULL,
    CONSTRAINT "AppVersionPreference_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AppVersionPreference" ("appId", "currentVersion", "enabled", "hasUpdate", "latestVersion", "runningConfig", "runningEnvironment", "sourceRepo", "sourceType") SELECT "appId", "currentVersion", "enabled", "hasUpdate", "latestVersion", "runningConfig", "runningEnvironment", "sourceRepo", "sourceType" FROM "AppVersionPreference";
DROP TABLE "AppVersionPreference";
ALTER TABLE "new_AppVersionPreference" RENAME TO "AppVersionPreference";
CREATE UNIQUE INDEX "AppVersionPreference_appId_key" ON "AppVersionPreference"("appId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
