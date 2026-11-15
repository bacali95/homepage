import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DockerhubFetcherService } from "./dockerhub-fetcher.service.js";
import { GhcrFetcherService } from "./ghcr-fetcher.service.js";
import { GithubReleasesFetcherService } from "./github-releases-fetcher.service.js";
import { K8sRegistryFetcherService } from "./k8s-registry-fetcher.service.js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

let fetchMock: ReturnType<typeof vi.fn>;
const originalToken = process.env.GITHUB_TOKEN;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = originalToken;
});

describe("DockerhubFetcherService", () => {
  const service = new DockerhubFetcherService();

  it("queries the hub API and returns the newest semver tag", async () => {
    fetchMock.mockResolvedValue(
      json({
        count: 4,
        next: null,
        previous: null,
        results: [
          { name: "latest" },
          { name: "1.2.0" },
          { name: "1.10.1" },
          { name: "alpine" },
        ],
      })
    );

    await expect(service.getLatestTag("library/nginx", null)).resolves.toBe(
      "1.10.1"
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://hub.docker.com/v2/repositories/library/nginx/tags?page_size=100"
    );
  });

  it.each([
    "https://hub.docker.com/r/owner/app",
    "http://hub.docker.com/r/owner/app/",
    "hub.docker.com/r/owner/app",
    "https://hub.docker.com/r/owner/app/tags",
    "https://hub.docker.com/r/owner/app/tags?page=1&name=x",
    "https://hub.docker.com/r/owner/app/general",
    "https://docker.io/owner/app",
    "docker.io/r/owner/app",
    "registry-1.docker.io/owner/app",
    "  owner/app/  ",
  ])("normalizes full or short source %s", async (source) => {
    fetchMock.mockResolvedValue(json({ results: [{ name: "1.0.0" }] }));
    await service.getLatestTag(source, null);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://hub.docker.com/v2/repositories/owner/app/tags?page_size=100"
    );
  });

  it.each([
    "https://hub.docker.com/_/nginx",
    "hub.docker.com/_/nginx/",
    "https://hub.docker.com/_/nginx/tags",
    "docker.io/library/nginx",
    "library/nginx",
    "nginx",
  ])("resolves official image source %s to library/nginx", async (source) => {
    fetchMock.mockResolvedValue(json({ results: [{ name: "1.0.0" }] }));
    await service.getLatestTag(source, null);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://hub.docker.com/v2/repositories/library/nginx/tags?page_size=100"
    );
  });

  it.each(["docker.io/owner/app", "owner/app"])(
    "normalizes source %s",
    async (source) => {
      fetchMock.mockResolvedValue(json({ results: [{ name: "1.0.0" }] }));
      await service.getLatestTag(source, null);
      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://hub.docker.com/v2/repositories/owner/app/tags?page_size=100"
      );
    }
  );

  it("keeps an image literally named like a hub page segment", async () => {
    fetchMock.mockResolvedValue(json({ results: [{ name: "1.0.0" }] }));
    await service.getLatestTag("owner/tags", null);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://hub.docker.com/v2/repositories/owner/tags/tags?page_size=100"
    );
  });

  it("honours the version extraction regex", async () => {
    fetchMock.mockResolvedValue(
      json({
        results: [
          { name: "2.0.0" },
          { name: "1.4.0-alpine" },
          { name: "1.5.0-alpine" },
        ],
      })
    );
    await expect(
      service.getLatestTag("o/a", "^(\\d+)\\.(\\d+)\\.(\\d+)-alpine$")
    ).resolves.toBe("1.5.0-alpine");
  });

  it("returns null on HTTP errors and malformed payloads", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 429));
    await expect(service.getLatestTag("o/a", null)).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(json({ unexpected: true }));
    await expect(service.getLatestTag("o/a", null)).resolves.toBeNull();
  });
});

describe("GhcrFetcherService", () => {
  const service = new GhcrFetcherService();

  const versions = [
    {
      id: 1,
      name: "a",
      updated_at: "",
      metadata: { container: { tags: ["latest", "1.2.0"] } },
    },
    {
      id: 2,
      name: "b",
      updated_at: "",
      metadata: { container: { tags: ["1.3.0"] } },
    },
    {
      id: 3,
      name: "c",
      updated_at: "",
      metadata: { container: { tags: ["latest", "1.1.0", "sha-xyz"] } },
    },
    { id: 4, name: "d", updated_at: "" },
  ];

  it("fails (returns null) without GITHUB_TOKEN and never calls fetch", async () => {
    delete process.env.GITHUB_TOKEN;
    await expect(service.getLatestTag("owner/repo", null)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("only considers versions tagged latest, and sends auth", async () => {
    process.env.GITHUB_TOKEN = "tok";
    fetchMock.mockResolvedValue(json(versions));

    await expect(service.getLatestTag("owner/repo", null)).resolves.toBe(
      "1.2.0"
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.github.com/users/owner/packages/container/repo/versions"
    );
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("uses the third segment as image name for owner/repo/image", async () => {
    process.env.GITHUB_TOKEN = "tok";
    fetchMock.mockResolvedValue(json(versions));
    await service.getLatestTag("ghcr.io/owner/repo/image", null);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/users/owner/packages/container/image/versions"
    );
  });

  it.each([
    "https://github.com/owner/repo",
    "http://github.com/owner/repo/",
    "github.com/owner/repo",
    "https://github.com/owner/repo.git",
    "https://www.github.com/owner/repo",
    "https://github.com/owner/repo/tree/main/docs",
    "https://github.com/owner/repo/releases",
    "https://github.com/owner/repo/pkgs/container/repo",
    "ghcr.io/owner/repo",
  ])("normalizes ghcr source %s", async (source) => {
    process.env.GITHUB_TOKEN = "tok";
    fetchMock.mockResolvedValue(json(versions));
    await service.getLatestTag(source, null);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/users/owner/packages/container/repo/versions"
    );
  });

  it("extracts the image from a github packages URL", async () => {
    process.env.GITHUB_TOKEN = "tok";
    fetchMock.mockResolvedValue(json(versions));
    await service.getLatestTag(
      "https://github.com/owner/repo/pkgs/container/image",
      null
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/users/owner/packages/container/image/versions"
    );
  });

  it("returns null for an invalid repository format", async () => {
    process.env.GITHUB_TOKEN = "tok";
    await expect(service.getLatestTag("just-one", null)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the API responds with an error", async () => {
    process.env.GITHUB_TOKEN = "tok";
    fetchMock.mockResolvedValue(json({ message: "Not Found" }, 404));
    await expect(service.getLatestTag("o/r", null)).resolves.toBeNull();
  });
});

describe("GithubReleasesFetcherService", () => {
  const service = new GithubReleasesFetcherService();

  it("hits releases/latest and returns the extracted version", async () => {
    delete process.env.GITHUB_TOKEN;
    fetchMock.mockResolvedValue(
      json({
        tag_name: "v3.4.5",
        name: "x",
        published_at: "",
        prerelease: false,
      })
    );

    await expect(service.getLatestTag("owner/repo", null)).resolves.toBe(
      "v3.4.5"
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.github.com/repos/owner/repo/releases/latest");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it.each([
    "https://github.com/owner/repo",
    "http://github.com/owner/repo/",
    "github.com/owner/repo",
    "https://github.com/owner/repo.git",
    "https://github.com/owner/repo/",
    "https://github.com/owner/repo/releases",
    "https://github.com/owner/repo/releases/tag/v1.0.0",
    "https://github.com/owner/repo/tree/main/src",
    "owner/repo",
  ])("accepts github source %s", async (source) => {
    fetchMock.mockResolvedValue(
      json({
        tag_name: "v1.0.0",
        name: "",
        published_at: "",
        prerelease: false,
      })
    );
    await service.getLatestTag(source, null);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/repos/owner/repo/releases/latest"
    );
  });

  it("strips decorations from the tag name", async () => {
    fetchMock.mockResolvedValue(
      json({
        tag_name: "release-1.2.3-final",
        name: "",
        published_at: "",
        prerelease: false,
      })
    );
    await expect(service.getLatestTag("o/r", null)).resolves.toBe("1.2.3");
  });

  it("returns null when the extracted tag is not semver", async () => {
    fetchMock.mockResolvedValue(
      json({
        tag_name: "nightly",
        name: "",
        published_at: "",
        prerelease: false,
      })
    );
    await expect(service.getLatestTag("o/r", null)).resolves.toBeNull();
  });

  it("uses the custom regex to extract and validate the tag", async () => {
    fetchMock.mockResolvedValue(
      json({
        tag_name: "server-2.1",
        name: "",
        published_at: "",
        prerelease: false,
      })
    );
    await expect(service.getLatestTag("o/r", "\\d+\\.\\d+")).resolves.toBe(
      "2.1"
    );
  });

  it("returns null on 404", async () => {
    fetchMock.mockResolvedValue(json({ message: "Not Found" }, 404));
    await expect(service.getLatestTag("o/r", null)).resolves.toBeNull();
  });
});

describe("K8sRegistryFetcherService", () => {
  const service = new K8sRegistryFetcherService();

  it("queries registry.k8s.io and returns the newest semver tag", async () => {
    fetchMock.mockResolvedValue(
      json({
        name: "kube-apiserver",
        tags: ["v1.29.0", "v1.30.2", "v1.30.10", "latest", "sha256-abc.sig"],
      })
    );

    await expect(service.getLatestTag("kube-apiserver", null)).resolves.toBe(
      "v1.30.10"
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://registry.k8s.io/v2/kube-apiserver/tags/list"
    );
  });

  it.each([
    "https://registry.k8s.io/ingress-nginx/controller",
    "registry.k8s.io/ingress-nginx/controller",
    "https://registry.k8s.io/ingress-nginx/controller/",
    "ingress-nginx/controller",
  ])("normalizes source %s", async (source) => {
    fetchMock.mockResolvedValue(json({ name: "x", tags: ["1.0.0"] }));
    await service.getLatestTag(source, null);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://registry.k8s.io/v2/ingress-nginx/controller/tags/list"
    );
  });

  it("returns null on error responses", async () => {
    fetchMock.mockResolvedValue(json({}, 500));
    await expect(service.getLatestTag("x", null)).resolves.toBeNull();
  });
});
