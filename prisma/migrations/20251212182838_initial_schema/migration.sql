-- CreateTable
CREATE TABLE "App" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppVersionPreference" (
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sourceType" TEXT NOT NULL,
    "sourceRepo" TEXT NOT NULL,
    "runningEnvironment" TEXT NOT NULL,
    "runningConfig" TEXT NOT NULL,
    "currentVersion" TEXT,
    "latestVersion" TEXT,
    "hasUpdate" BOOLEAN NOT NULL DEFAULT false,
    "appId" INTEGER NOT NULL,
    CONSTRAINT "AppVersionPreference_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppPingPreference" (
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "url" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "ignoreSsl" BOOLEAN NOT NULL DEFAULT false,
    "appId" INTEGER NOT NULL,
    CONSTRAINT "AppPingPreference_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PingHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "appId" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PingHistory_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationChannel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppNotificationPreference" (
    "appId" INTEGER NOT NULL,
    "channelType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AppNotificationPreference_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AppNotificationPreference_channelType_fkey" FOREIGN KEY ("channelType") REFERENCES "NotificationChannel" ("channelType") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "App_name_key" ON "App"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AppVersionPreference_appId_key" ON "AppVersionPreference"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "AppPingPreference_appId_key" ON "AppPingPreference"("appId");

-- CreateIndex
CREATE INDEX "PingHistory_appId_idx" ON "PingHistory"("appId");

-- CreateIndex
CREATE INDEX "PingHistory_createdAt_idx" ON "PingHistory"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationChannel_channelType_key" ON "NotificationChannel"("channelType");

-- CreateIndex
CREATE UNIQUE INDEX "AppNotificationPreference_appId_channelType_key" ON "AppNotificationPreference"("appId", "channelType");
