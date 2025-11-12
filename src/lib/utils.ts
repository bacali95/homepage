import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type SourceType } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVersion(version: string): string {
  return version.startsWith("v") ? version : `v${version}`;
}

export function getSourceTypeLabel(sourceType: SourceType): string {
  switch (sourceType) {
    case "ghcr":
      return "GHCR";
    case "dockerhub":
      return "Docker Hub";
    case "k8s":
      return "K8s Registry";
    case "github":
    default:
      return "GitHub Releases";
  }
}

export function groupAppsByCategory<T extends { category: string | null }>(
  apps: T[]
): Record<string, T[]> {
  return apps.reduce((acc, app) => {
    const category = app.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(app);
    return acc;
  }, {} as Record<string, T[]>);
}

export function sortCategories(categories: string[]): string[] {
  return categories.sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });
}
