import { Injectable } from "@nestjs/common";
import { GhcrFetcherService } from "../tags-fetchers/ghcr-fetcher.service.js";
import { DockerhubFetcherService } from "../tags-fetchers/dockerhub-fetcher.service.js";
import { K8sRegistryFetcherService } from "../tags-fetchers/k8s-registry-fetcher.service.js";
import { GithubReleasesFetcherService } from "../tags-fetchers/github-releases-fetcher.service.js";

@Injectable()
export class ReleasesService {
  constructor(
    private readonly ghcrFetcherService: GhcrFetcherService,
    private readonly dockerhubFetcherService: DockerhubFetcherService,
    private readonly k8sRegistryFetcherService: K8sRegistryFetcherService,
    private readonly githubReleasesFetcherService: GithubReleasesFetcherService
  ) {}

  async getReleases(source: string, repo: string) {
    if (source === "github") {
      return await this.githubReleasesFetcherService.fetchReleases(repo);
    } else if (source === "ghcr") {
      return await this.ghcrFetcherService.fetchTags(repo);
    } else if (source === "dockerhub") {
      return await this.dockerhubFetcherService.fetchTags(repo);
    } else if (source === "k8s") {
      return await this.k8sRegistryFetcherService.fetchTags(repo);
    } else {
      throw new Error("Invalid source type");
    }
  }
}
