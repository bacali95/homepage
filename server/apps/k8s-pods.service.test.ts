import { beforeEach, describe, expect, it, vi } from "vitest";

import { K8sPodsService } from "./k8s-pods.service.js";

const listNamespacedPod = vi.fn();

vi.mock("@kubernetes/client-node", () => {
  class KubeConfig {
    loadFromCluster() {}
    makeApiClient() {
      return { listNamespacedPod };
    }
  }
  return { KubeConfig, CoreV1Api: class {} };
});

const pod = (...images: (string | undefined)[]) => ({
  spec: { containers: images.map((image) => ({ name: "c", image })) },
});

describe("K8sPodsService.getVersionFromPod", () => {
  let service: K8sPodsService;
  beforeEach(() => {
    listNamespacedPod.mockReset();
    service = new K8sPodsService();
  });

  it("lists pods in the requested namespace", async () => {
    listNamespacedPod.mockResolvedValue({ items: [] });
    await service.getVersionFromPod("nginx:1.0.0", "web");
    expect(listNamespacedPod).toHaveBeenCalledWith({ namespace: "web" });
  });

  it("returns the tag of the matching container image", async () => {
    listNamespacedPod.mockResolvedValue({
      items: [pod("redis:7.0.0"), pod("nginx:1.25.3")],
    });
    await expect(service.getVersionFromPod("nginx:1.0.0", "web")).resolves.toBe(
      "1.25.3"
    );
  });

  it("matches across registries in either direction", async () => {
    listNamespacedPod.mockResolvedValue({
      items: [pod("ghcr.io/owner/app:v2.0.0")],
    });
    await expect(service.getVersionFromPod("owner/app", "ns")).resolves.toBe(
      "v2.0.0"
    );

    listNamespacedPod.mockResolvedValue({ items: [pod("app:3.1.0")] });
    await expect(
      service.getVersionFromPod("ghcr.io/owner/app:1.0.0", "ns")
    ).resolves.toBe("3.1.0");
  });

  it("defaults the tag to latest when the image has none", async () => {
    listNamespacedPod.mockResolvedValue({ items: [pod("nginx")] });
    await expect(service.getVersionFromPod("nginx", "ns")).resolves.toBe(
      "latest"
    );
  });

  it("supports the legacy { body } response shape", async () => {
    listNamespacedPod.mockResolvedValue({
      body: { items: [pod("nginx:9.9.9")] },
    });
    await expect(service.getVersionFromPod("nginx", "ns")).resolves.toBe(
      "9.9.9"
    );
  });

  it("skips pods/containers without spec or image", async () => {
    listNamespacedPod.mockResolvedValue({
      items: [{}, { spec: {} }, pod(undefined), pod("nginx:1.0.0")],
    });
    await expect(service.getVersionFromPod("nginx", "ns")).resolves.toBe(
      "1.0.0"
    );
  });

  it("returns null when nothing matches or there are no pods", async () => {
    listNamespacedPod.mockResolvedValue({ items: [pod("redis:7")] });
    await expect(service.getVersionFromPod("nginx", "ns")).resolves.toBeNull();

    listNamespacedPod.mockResolvedValue({ items: [] });
    await expect(service.getVersionFromPod("nginx", "ns")).resolves.toBeNull();
  });

  it("returns null (does not throw) when the k8s API fails", async () => {
    listNamespacedPod.mockRejectedValue(new Error("forbidden"));
    await expect(service.getVersionFromPod("nginx", "ns")).resolves.toBeNull();
  });
});
