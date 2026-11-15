import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useThemeState } from "./use-theme";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
  window.matchMedia = globalThis.matchMedia;
}

describe("useThemeState", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("defaults to the system theme", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useThemeState());
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("restores the stored theme", () => {
    mockMatchMedia(true);
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useThemeState());
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("persists theme changes", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useThemeState());
    act(() => result.current.setTheme("dark"));
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });
});
