import { describe, expect, it } from "vitest";

import {
  cn,
  formatVersion,
  groupAppsByCategory,
  parseRunningConfig,
  pingStatusOf,
  SLOW_PING_MS,
  sortCategories,
  truncateText,
} from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind classes, last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", 0 as number, undefined, null, "c")).toBe("a c");
  });
});

describe("formatVersion", () => {
  it("returns empty string for null or empty", () => {
    expect(formatVersion(null)).toBe("");
    expect(formatVersion("")).toBe("");
  });

  it("prefixes v when missing and keeps it when present", () => {
    expect(formatVersion("1.2.3")).toBe("v1.2.3");
    expect(formatVersion("v1.2.3")).toBe("v1.2.3");
  });
});

describe("groupAppsByCategory", () => {
  it("groups by category and falls back to Uncategorized", () => {
    const apps = [
      { id: 1, category: "Media" },
      { id: 2, category: "" },
      { id: 3, category: "Media" },
    ];
    const grouped = groupAppsByCategory(apps);
    expect(Object.keys(grouped).sort()).toEqual(["Media", "Uncategorized"]);
    expect(grouped.Media.map((a) => a.id)).toEqual([1, 3]);
    expect(grouped.Uncategorized.map((a) => a.id)).toEqual([2]);
  });

  it("returns an empty object for no apps", () => {
    expect(groupAppsByCategory([])).toEqual({});
  });
});

describe("sortCategories", () => {
  it("sorts alphabetically with Uncategorized last", () => {
    expect(sortCategories(["Uncategorized", "Media", "Dev", "Infra"])).toEqual([
      "Dev",
      "Infra",
      "Media",
      "Uncategorized",
    ]);
  });
});

describe("truncateText", () => {
  it("leaves short text alone", () => {
    expect(truncateText("hello", 5)).toBe("hello");
  });

  it("truncates with an ellipsis within maxLength", () => {
    const out = truncateText("hello world", 8);
    expect(out).toBe("hello...");
    expect(out).toHaveLength(8);
  });
});

describe("pingStatusOf", () => {
  it("is unknown without a sample", () => {
    expect(pingStatusOf(undefined)).toBe("unknown");
  });

  it("is down when the ping failed, whatever the latency", () => {
    expect(pingStatusOf({ status: false, responseTime: 5 })).toBe("down");
  });

  it("is up for a fast success and slow from the threshold up", () => {
    expect(pingStatusOf({ status: true, responseTime: 40 })).toBe("up");
    expect(pingStatusOf({ status: true, responseTime: null })).toBe("up");
    expect(pingStatusOf({ status: true, responseTime: SLOW_PING_MS - 1 })).toBe(
      "up"
    );
    expect(pingStatusOf({ status: true, responseTime: SLOW_PING_MS })).toBe(
      "slow"
    );
  });
});

describe("parseRunningConfig", () => {
  it("parses the stored JSON", () => {
    expect(
      parseRunningConfig('{"dockerImage":"a/b","k8sNamespace":"ns"}')
    ).toEqual({ dockerImage: "a/b", k8sNamespace: "ns" });
  });

  it("falls back to an empty config for missing or invalid JSON", () => {
    expect(parseRunningConfig(undefined)).toEqual({});
    expect(parseRunningConfig("")).toEqual({});
    expect(parseRunningConfig("{nope")).toEqual({});
  });
});
