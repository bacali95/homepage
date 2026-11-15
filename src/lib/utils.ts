import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVersion(version: string | null): string {
  if (!version) return "";

  return version.startsWith("v") ? version : `v${version}`;
}

export function groupAppsByCategory<T extends { category: string }>(
  apps: T[]
): Record<string, T[]> {
  return apps.reduce(
    (acc, app) => {
      const category = app.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(app);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export function sortCategories(categories: string[]): string[] {
  return categories.sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export type PingStatus = "up" | "down" | "slow" | "unknown";

export const SLOW_PING_MS = 800;

export interface PingSample {
  status: boolean;
  responseTime: number | null;
}

export function pingStatusOf(sample: PingSample | undefined): PingStatus {
  if (!sample) return "unknown";
  if (!sample.status) return "down";
  if (sample.responseTime !== null && sample.responseTime >= SLOW_PING_MS) {
    return "slow";
  }
  return "up";
}

export function parseRunningConfig(raw: string | null | undefined): {
  dockerImage?: string;
  k8sNamespace?: string;
} {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}
