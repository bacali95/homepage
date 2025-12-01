import { Module } from "@nestjs/common";

import { DockerhubFetcherService } from "./dockerhub-fetcher.service.js";
import { GhcrFetcherService } from "./ghcr-fetcher.service.js";
import { GithubReleasesFetcherService } from "./github-releases-fetcher.service.js";
import { K8sRegistryFetcherService } from "./k8s-registry-fetcher.service.js";

@Module({
  providers: [
    GhcrFetcherService,
    DockerhubFetcherService,
    K8sRegistryFetcherService,
    GithubReleasesFetcherService,
  ],
  exports: [
    GhcrFetcherService,
    DockerhubFetcherService,
    K8sRegistryFetcherService,
    GithubReleasesFetcherService,
  ],
})
export class TagsFetchersModule {}
