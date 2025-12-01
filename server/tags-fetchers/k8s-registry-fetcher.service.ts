import { Injectable } from "@nestjs/common";

import { createTagsFetcher } from "./common.js";

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
  });

  getLatestTag(repo: string): Promise<string | null> {
    return this.fetcher(repo);
  }
}
