import * as k8s from "@kubernetes/client-node";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PodsService {
  private readonly logger = new Logger(PodsService.name);
  private k8sApi: k8s.CoreV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    // This will use ~/.kube/config or KUBECONFIG env var
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  /**
   * Fetches the current running version from a Kubernetes pod by matching the docker image.
   * The version is extracted from the image tag.
   *
   * @param dockerImage - The docker image name (e.g., "nginx:1.21.0" or "ghcr.io/owner/repo:v1.0.0")
   * @param namespace - Required namespace to search in.
   * @returns The version tag from the running pod, or null if not found
   */
  async #getVersionFromPod(
    dockerImage: string,
    namespace: string
  ): Promise<string | null> {
    try {
      const api = this.k8sApi;
      // The API returns V1PodList directly, but at runtime it may have a body property
      // We'll handle both cases for compatibility
      const response = await api.listNamespacedPod({ namespace });
      const pods = (response as any).body || response;
      if (!pods?.items || pods.items.length === 0) {
        return null;
      }

      // Extract image name and tag from dockerImage
      const imageParts = dockerImage.split(":");
      const imageName = imageParts[0];

      // Search through all pods
      for (const pod of pods.items) {
        if (!pod.spec || !pod.spec.containers) {
          continue;
        }

        for (const container of pod.spec.containers) {
          if (!container.image) {
            continue;
          }

          const containerImage = container.image;
          const containerImageName = containerImage.split(":")[0];
          const containerImageTag = containerImage.split(":")[1] || "latest";

          // Match by image name (allowing for different registries)
          const imageNameMatch =
            containerImageName === imageName ||
            containerImageName.endsWith(`/${imageName.split("/").pop()}`) ||
            imageName.endsWith(`/${containerImageName.split("/").pop()}`);

          if (imageNameMatch) {
            // Return the tag from the running container
            this.logger.log(
              `Successfully found version ${containerImageTag} for image ${dockerImage} in namespace ${namespace}`
            );
            return containerImageTag;
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching version from pod for image ${dockerImage}:`,
        error
      );
      return null;
    }
  }

  async getVersionFromPod(dockerImage: string, namespace: string) {
    const version = await this.#getVersionFromPod(dockerImage, namespace);
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
