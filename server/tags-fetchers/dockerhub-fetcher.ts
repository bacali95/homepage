import { type Tag, createTagsFetcher } from "./common.js";

export interface DockerHubResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tag[];
}

const dockerHubFetcher = createTagsFetcher<DockerHubResponse>({
  name: "Docker Hub",
  pathReplacements: [
    { pattern: /^https?:\/\/hub\.docker\.com\/r\//, replacement: "" },
    { pattern: /^docker\.io\//, replacement: "" },
  ],
  buildUrl: (normalizedPath) =>
    `https://hub.docker.com/v2/repositories/${normalizedPath}/tags?page_size=100`,
  getHeaders: () => ({
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
  }),
  transformResponse: (data) => data.results,
});

export const fetchTags = dockerHubFetcher.fetchTags;
export const getLatestTag = dockerHubFetcher.getLatestTag;
