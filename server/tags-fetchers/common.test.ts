import { afterEach, describe, expect, it, vi } from "vitest";

import {
  compareVersions,
  createGitHubHeaders,
  createTagsFetcher,
  extractSemverFromTag,
  extractVersionNumbers,
  filterSemverTags,
  getLatestTag,
  isSemver,
  normalizePath,
  safeFetch,
} from "./common.js";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("isSemver", () => {
  it.each(["1.0.0", "v1.2.3", "V10.20.30", "0.0.1"])(
    "accepts plain semver tag %s",
    (tag) => {
      expect(isSemver(tag, null)).toBe(true);
    }
  );

  it.each(["latest", "1.0", "1.0.0-beta", "1.2.3.4", "release-1.2.3", ""])(
    "rejects %j with the default pattern",
    (tag) => {
      expect(isSemver(tag, null)).toBe(false);
    }
  );

  it("uses the custom regex instead of the default when provided", () => {
    expect(isSemver("1.0.0-beta", "^\\d+\\.\\d+\\.\\d+-beta$")).toBe(true);
    expect(isSemver("1.0.0", "^\\d+\\.\\d+\\.\\d+-beta$")).toBe(false);
  });

  it("treats empty/undefined regex as absent", () => {
    expect(isSemver("1.2.3", undefined)).toBe(true);
    expect(isSemver("1.2.3", "")).toBe(true);
  });
});

describe("extractSemverFromTag", () => {
  it("extracts the version out of a decorated tag", () => {
    expect(extractSemverFromTag("release-v1.2.3-final", null)).toBe("v1.2.3");
    expect(extractSemverFromTag("app@2.0.1", null)).toBe("2.0.1");
  });

  it("returns the tag unchanged when nothing matches", () => {
    expect(extractSemverFromTag("nightly", null)).toBe("nightly");
  });

  it("returns the whole match (not the capture group) for custom regex", () => {
    expect(extractSemverFromTag("foo-1.2.3", "(\\d+)\\.\\d+\\.\\d+")).toBe(
      "1.2.3"
    );
  });
});

describe("normalizePath", () => {
  it("strips protocol, .git suffix and trailing slash", () => {
    expect(normalizePath("https://github.com/owner/repo.git")).toBe(
      "github.com/owner/repo"
    );
    expect(normalizePath("http://example.com/a/b/")).toBe("example.com/a/b");
  });

  it("applies custom replacements after normalizing", () => {
    expect(
      normalizePath("https://github.com/owner/repo", [
        { pattern: /^github\.com\//, replacement: "" },
      ])
    ).toBe("owner/repo");
  });

  it("strips .git even when followed by a trailing slash", () => {
    expect(normalizePath("owner/repo.git/")).toBe("owner/repo");
  });

  it("trims whitespace and drops query string / fragment", () => {
    expect(normalizePath("  https://x.io/a/b/?tab=1#top ")).toBe("x.io/a/b");
  });

  it("leaves bare paths untouched", () => {
    expect(normalizePath("owner/repo")).toBe("owner/repo");
  });
});

describe("filterSemverTags", () => {
  it("drops latest and non-semver tags", () => {
    expect(
      filterSemverTags(
        ["latest", "1.0.0", "v2.0.0", "main", "1.0.0-rc.1", "sha-abc"],
        null
      )
    ).toEqual(["1.0.0", "v2.0.0"]);
  });

  it("applies the custom regex", () => {
    expect(
      filterSemverTags(["1.0.0", "1.0.0-alpine", "2.0.0-alpine"], "-alpine$")
    ).toEqual(["1.0.0-alpine", "2.0.0-alpine"]);
  });
});

describe("extractVersionNumbers", () => {
  it("extracts every number when no regex is given", () => {
    expect(extractVersionNumbers("v1.22.3-build4", null)).toEqual([
      1, 22, 3, 4,
    ]);
    expect(extractVersionNumbers("latest", undefined)).toEqual([]);
  });

  it("returns the capture groups when the regex has them", () => {
    expect(
      extractVersionNumbers("app-1.2.3-extra9", "^app-(\\d+)\\.(\\d+)")
    ).toEqual([1, 2]);
  });

  it("skips non-numeric and unmatched groups", () => {
    expect(extractVersionNumbers("1.x", "(\\d+)\\.(x)")).toEqual([1]);
    expect(extractVersionNumbers("1", "(\\d+)(\\.\\d+)?")).toEqual([1]);
  });

  it("extracts all numbers of the full match when no capture groups", () => {
    expect(
      extractVersionNumbers("foo 1.2.3 bar 9", "\\d+\\.\\d+\\.\\d+")
    ).toEqual([1, 2, 3]);
  });

  it("falls back to default extraction when the regex does not match", () => {
    expect(extractVersionNumbers("v3.4", "^nomatch$")).toEqual([3, 4]);
  });

  it("falls back to default extraction on an invalid regex", () => {
    expect(extractVersionNumbers("v3.4", "(")).toEqual([3, 4]);
  });
});

describe("compareVersions (default)", () => {
  // negative => a is newer than b (sorts first), positive => a is older
  it("returns negative when a is newer", () => {
    expect(compareVersions("1.2.4", "1.2.3", null)).toBeLessThan(0);
    expect(compareVersions("2.0.0", "1.99.99", null)).toBeLessThan(0);
  });

  it("returns positive when a is older", () => {
    expect(compareVersions("1.2.3", "1.2.4", null)).toBeGreaterThan(0);
  });

  it("returns 0 for equal versions regardless of v prefix", () => {
    expect(compareVersions("v1.2.3", "1.2.3", null)).toBe(0);
    expect(compareVersions("V1.2.3", "v1.2.3", null)).toBe(0);
  });

  it("compares numerically, not lexically", () => {
    expect(compareVersions("1.10.0", "1.9.0", null)).toBeLessThan(0);
  });

  it("treats missing trailing parts as zero", () => {
    expect(compareVersions("1.2", "1.2.0", null)).toBe(0);
    expect(compareVersions("1.2.1", "1.2", null)).toBeLessThan(0);
  });

  it("sorts newest first when used with Array.sort", () => {
    const tags = ["v1.0.0", "v1.10.0", "v1.2.0", "v0.9.9", "v2.0.0"];
    expect(tags.sort((a, b) => compareVersions(a, b, null))).toEqual([
      "v2.0.0",
      "v1.10.0",
      "v1.2.0",
      "v1.0.0",
      "v0.9.9",
    ]);
  });

  it("splits on dashes and compares string parts lexically (current behavior)", () => {
    // Pre-release suffixes are compared as plain strings against numeric
    // parts: "1.0.0-beta" is considered NEWER than "1.0.0". Locked in as-is.
    expect(compareVersions("1.0.0-beta", "1.0.0", null)).toBeLessThan(0);
    expect(compareVersions("1.0.0-b", "1.0.0-a", null)).toBeLessThan(0);
  });
});

describe("compareVersions (custom regex)", () => {
  const regex = "^(\\d+)\\.(\\d+)\\.(\\d+)-alpine$";

  it("compares only the captured numbers", () => {
    expect(compareVersions("2.0.0-alpine", "1.9.9-alpine", regex)).toBeLessThan(
      0
    );
    expect(
      compareVersions("1.0.0-alpine", "1.0.1-alpine", regex)
    ).toBeGreaterThan(0);
    expect(compareVersions("1.0.0-alpine", "1.0.0-alpine", regex)).toBe(0);
  });

  it("pads the shorter number list with zeros", () => {
    expect(
      compareVersions("1.2", "1.2.0", "(\\d+)\\.(\\d+)(?:\\.(\\d+))?")
    ).toBe(0);
  });
});

describe("getLatestTag", () => {
  it("returns the first tag or null", () => {
    expect(getLatestTag(["2.0.0", "1.0.0"])).toBe("2.0.0");
    expect(getLatestTag([])).toBeNull();
  });
});

describe("createGitHubHeaders", () => {
  const original = process.env.GITHUB_TOKEN;
  afterEach(() => {
    if (original === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = original;
  });

  it("omits Authorization without a token", () => {
    delete process.env.GITHUB_TOKEN;
    const headers = createGitHubHeaders() as Record<string, string>;
    expect(headers.Accept).toBe("application/vnd.github+json");
    expect(headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
    expect(headers.Authorization).toBeUndefined();
  });

  it("adds a Bearer token when GITHUB_TOKEN is set", () => {
    process.env.GITHUB_TOKEN = "abc";
    const headers = createGitHubHeaders() as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer abc");
  });
});

describe("safeFetch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ a: 1 })));
    await expect(safeFetch("http://x", {}, "Ctx")).resolves.toEqual({ a: 1 });
  });

  it("returns null on non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 }))
    );
    await expect(safeFetch("http://x", {}, "Ctx")).resolves.toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    await expect(safeFetch("http://x", {}, "Ctx")).resolves.toBeNull();
  });
});

describe("createTagsFetcher", () => {
  afterEach(() => vi.unstubAllGlobals());

  const make = (headers?: () => HeadersInit) =>
    createTagsFetcher<{ tags: string[] }>({
      name: "Test",
      pathReplacements: [{ pattern: /^pre\//, replacement: "" }],
      buildUrl: (p) => `https://example.test/${p}`,
      getHeaders: headers,
      transformResponse: (d) => d.tags,
    });

  it("normalizes the source, builds the URL, filters and returns the newest tag", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ tags: ["latest", "1.0.0", "1.10.0", "main", "1.2.0"] })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await make(() => ({ "X-Test": "1" }))(
      "https://pre/owner/repo.git",
      null
    );

    expect(result).toBe("1.10.0");
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/owner/repo", {
      headers: { "X-Test": "1" },
    });
  });

  it("returns null when no tag survives filtering", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ tags: ["latest", "edge"] }))
    );
    await expect(make()("a/b", null)).resolves.toBeNull();
  });

  it("returns null on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("x", { status: 404 }))
    );
    await expect(make()("a/b", null)).resolves.toBeNull();
  });

  it("returns null when fetch rejects or headers builder throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    await expect(make()("a/b", null)).resolves.toBeNull();

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      make(() => {
        throw new Error("no token");
      })("a/b", null)
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("honours the version extraction regex for both filter and sort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          tags: ["1.0.0-alpine", "2.0.0", "1.5.0-alpine", "1.0.0"],
        })
      )
    );
    await expect(
      make()("a/b", "^(\\d+)\\.(\\d+)\\.(\\d+)-alpine$")
    ).resolves.toBe("1.5.0-alpine");
  });
});
