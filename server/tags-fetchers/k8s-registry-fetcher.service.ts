import { Injectable } from "@nestjs/common";
import { type Tag, createTagsFetcher, compareVersions } from "./common.js";

export interface K8sRegistryResponse {
  name: string;
  tags: string[];
}

@Injectable()
export class K8sRegistryFetcherService {
  private readonly fetcher = createTagsFetcher<K8sRegistryResponse>({
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

  async fetchTags(repo: string): Promise<Tag[]> {
    return this.fetcher.fetchTags(repo);
  }

  async getLatestTag(repo: string): Promise<string | null> {
    return this.fetcher.getLatestTag(repo);
  }
}
