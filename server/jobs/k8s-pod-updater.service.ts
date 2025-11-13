import { Injectable, Logger } from "@nestjs/common";
import * as k8s from "@kubernetes/client-node";
import { DatabaseService } from "../database/database.service.js";

@Injectable()
export class K8sPodUpdaterService {
  private readonly logger = new Logger(K8sPodUpdaterService.name);
  private k8sApi: k8s.CoreV1Api | null = null;

  constructor(private readonly databaseService: DatabaseService) {}

  private getK8sApi(): k8s.CoreV1Api {
    if (!this.k8sApi) {
      const kc = new k8s.KubeConfig();
      // This will use ~/.kube/config or KUBECONFIG env var
      kc.loadFromDefault();
      this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    }
    return this.k8sApi;
  }

  /**
   * Fetches the current running version from a Kubernetes pod by matching the docker image.
   * The version is extracted from the image tag.
   *
   * @param dockerImage - The docker image name (e.g., "nginx:1.21.0" or "ghcr.io/owner/repo:v1.0.0")
   * @param namespace - Required namespace to search in.
   * @returns The version tag from the running pod, or null if not found
   */
  async getVersionFromPod(
    dockerImage: string,
    namespace: string
  ): Promise<string | null> {
    try {
      const api = this.getK8sApi();
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

  /**
   * Get all apps that have docker_image set and update their current_version
   */
  async updateVersionsFromPods() {
    const apps = this.databaseService.getAllApps();

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const app of apps) {
      if (!app.docker_image || !app.k8s_namespace) {
        skippedCount++;
        continue;
      }

      try {
        const version = await this.getVersionFromPod(
          app.docker_image,
          app.k8s_namespace
        );
        if (version && version !== app.current_version) {
          this.databaseService.updateApp(app.id, {
            current_version: version,
          });
          this.logger.log(
            `Updated ${app.name} version from ${app.current_version} to ${version}`
          );
          updatedCount++;
        } else if (version) {
          this.logger.log(
            `App ${app.name} is already at version ${version}, no update needed`
          );
        }
        processedCount++;
      } catch (error) {
        this.logger.error(
          `Error updating version from pod for ${app.name}:`,
          error
        );
      }
    }

    this.logger.log(
      `K8s pod version update completed: ${processedCount} processed, ${updatedCount} updated, ${skippedCount} skipped`
    );
  }
}
