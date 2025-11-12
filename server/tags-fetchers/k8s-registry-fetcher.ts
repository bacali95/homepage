import { createTagsFetcher, compareVersions } from "./common.js";

export interface K8sRegistryResponse {
  name: string;
  tags: string[];
}

const k8sRegistryFetcher = createTagsFetcher<K8sRegistryResponse>({
  name: "Kubernetes registry",
  pathReplacements: [
    { pattern: /^https?:\/\/registry\.k8s\.io\//, replacement: "" },
    { pattern: /^registry\.k8s\.io\//, replacement: "" },
  ],
  buildUrl: (normalizedPath) =>
    `https://registry.k8s.io/v2/${normalizedPath}/tags/list`,
  transformResponse: (data) =>
    data.tags.map((name) => ({ name, last_updated: "" })),
  sortTags: (tags) => tags.sort((a, b) => compareVersions(a.name, b.name)),
});

export const fetchTags = k8sRegistryFetcher.fetchTags;
export const getLatestTag = k8sRegistryFetcher.getLatestTag;
