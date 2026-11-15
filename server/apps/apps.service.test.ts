import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppsService } from "./apps.service.js";

function prefs(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    sourceType: "GITHUB_RELEASES",
    sourceRepo: "o/r",
    runningEnvironment: "KUBERNETES",
    runningConfig: JSON.stringify({
      dockerImage: "ghcr.io/o/r:1.0.0",
      k8sNamespace: "media",
    }),
    currentVersion: "1.0.0",
    latestVersion: null,
    hasUpdate: false,
    versionExtractionRegex: null,
    appId: 1,
    ...overrides,
  };
}

describe("AppsService", () => {
  const k8sPods = { getVersionFromPod: vi.fn() };
  const db = {
    app: { findMany: vi.fn() },
    appVersionPreference: { update: vi.fn() },
  };
  let service: AppsService;

  beforeEach(() => {
    k8sPods.getVersionFromPod = vi.fn();
    db.app.findMany = vi.fn();
    db.appVersionPreference.update = vi.fn();
    service = new AppsService(k8sPods as never, db as never);
  });

  describe("getRunningVersion", () => {
    it("asks the k8s service with image and namespace from runningConfig", async () => {
      k8sPods.getVersionFromPod.mockResolvedValue("1.2.3");
      await expect(service.getRunningVersion(prefs() as never)).resolves.toBe(
        "1.2.3"
      );
      expect(k8sPods.getVersionFromPod).toHaveBeenCalledWith(
        "ghcr.io/o/r:1.0.0",
        "media"
      );
    });

    it("rejects unsupported running environments", async () => {
      await expect(
        service.getRunningVersion(
          prefs({ runningEnvironment: "DOCKER" }) as never
        )
      ).rejects.toThrow("Unsupported running environment: DOCKER");
    });

    it("rejects on malformed runningConfig JSON", async () => {
      await expect(
        service.getRunningVersion(prefs({ runningConfig: "{nope" }) as never)
      ).rejects.toThrow();
    });
  });

  describe("updateVersionsFromPods", () => {
    it("updates currentVersion only when the pod version differs", async () => {
      db.app.findMany.mockResolvedValue([
        { id: 1, name: "changed", versionPreferences: prefs({ appId: 1 }) },
        {
          id: 2,
          name: "same",
          versionPreferences: prefs({ appId: 2, currentVersion: "2.0.0" }),
        },
        {
          id: 3,
          name: "disabled",
          versionPreferences: prefs({ appId: 3, enabled: false }),
        },
        { id: 4, name: "no-prefs", versionPreferences: null },
      ]);
      k8sPods.getVersionFromPod
        .mockResolvedValueOnce("1.1.0")
        .mockResolvedValueOnce("2.0.0");

      await service.updateVersionsFromPods();

      expect(k8sPods.getVersionFromPod).toHaveBeenCalledTimes(2);
      expect(db.appVersionPreference.update).toHaveBeenCalledTimes(1);
      expect(db.appVersionPreference.update).toHaveBeenCalledWith({
        where: { appId: 1 },
        data: { currentVersion: "1.1.0" },
      });
    });

    it("treats v-prefix differences as equal (no write)", async () => {
      db.app.findMany.mockResolvedValue([
        {
          id: 1,
          name: "a",
          versionPreferences: prefs({ currentVersion: "1.0.0" }),
        },
      ]);
      k8sPods.getVersionFromPod.mockResolvedValue("v1.0.0");
      await service.updateVersionsFromPods();
      expect(db.appVersionPreference.update).not.toHaveBeenCalled();
    });

    it("writes when currentVersion was never set", async () => {
      db.app.findMany.mockResolvedValue([
        {
          id: 1,
          name: "a",
          versionPreferences: prefs({ currentVersion: null }),
        },
      ]);
      k8sPods.getVersionFromPod.mockResolvedValue("1.0.0");
      await service.updateVersionsFromPods();
      expect(db.appVersionPreference.update).toHaveBeenCalledWith({
        where: { appId: 1 },
        data: { currentVersion: "1.0.0" },
      });
    });

    it("ignores apps whose pod is not found", async () => {
      db.app.findMany.mockResolvedValue([
        { id: 1, name: "a", versionPreferences: prefs() },
      ]);
      k8sPods.getVersionFromPod.mockResolvedValue(null);
      await service.updateVersionsFromPods();
      expect(db.appVersionPreference.update).not.toHaveBeenCalled();
    });

    it("continues after an app fails", async () => {
      db.app.findMany.mockResolvedValue([
        { id: 1, name: "bad", versionPreferences: prefs({ appId: 1 }) },
        { id: 2, name: "good", versionPreferences: prefs({ appId: 2 }) },
      ]);
      k8sPods.getVersionFromPod
        .mockRejectedValueOnce(new Error("api"))
        .mockResolvedValueOnce("9.9.9");

      await expect(service.updateVersionsFromPods()).resolves.toBeUndefined();
      expect(db.appVersionPreference.update).toHaveBeenCalledWith({
        where: { appId: 2 },
        data: { currentVersion: "9.9.9" },
      });
    });
  });
});
