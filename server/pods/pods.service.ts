import { Injectable, Logger } from "@nestjs/common";
import { K8sPodUpdaterService } from "../jobs/k8s-pod-updater.service.js";

@Injectable()
export class PodsService {
  private readonly logger = new Logger(PodsService.name);

  constructor(private readonly k8sPodUpdaterService: K8sPodUpdaterService) {}

  async getVersionFromPod(dockerImage: string, namespace: string) {
    const version = await this.k8sPodUpdaterService.getVersionFromPod(
      dockerImage,
      namespace
    );
    if (version) {
      this.logger.log(
        `Successfully fetched pod version: ${version} for ${dockerImage} in namespace ${namespace}`
      );
    } else {
      this.logger.log(
        `No pod version found for ${dockerImage} in namespace ${namespace}`
      );
    }
    return version;
  }
}
