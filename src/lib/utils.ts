import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVersion(version: string): string {
  return version.startsWith("v") ? version : `v${version}`;
}

export function groupAppsByCategory<T extends { category: string | null }>(
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
