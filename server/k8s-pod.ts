import * as k8s from "@kubernetes/client-node";
import { createLogger } from "./logger.js";

const log = createLogger({ service: "K8sPod" });

// Initialize Kubernetes client
let k8sApi: k8s.CoreV1Api | null = null;

function getK8sApi(): k8s.CoreV1Api {
  if (!k8sApi) {
    const kc = new k8s.KubeConfig();
    // This will use ~/.kube/config or KUBECONFIG env var
    kc.loadFromDefault();
    k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  }
  return k8sApi;
}

/**
 * Fetches the current running version from a Kubernetes pod by matching the docker image.
 * The version is extracted from the image tag.
 *
 * @param dockerImage - The docker image name (e.g., "nginx:1.21.0" or "ghcr.io/owner/repo:v1.0.0")
 * @param namespace - Required namespace to search in.
 * @returns The version tag from the running pod, or null if not found
 */
export async function getVersionFromPod(
  dockerImage: string,
  namespace: string
): Promise<string | null> {
  try {
    const api = getK8sApi();
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
          log.info(
            `Successfully found version ${containerImageTag} for image ${dockerImage} in namespace ${namespace}`
          );
          return containerImageTag;
        }
      }
    }

    return null;
  } catch (error) {
    log.error(
      `Error fetching version from pod for image ${dockerImage}:`,
      error
    );
    return null;
  }
}

/**
 * Get all apps that have docker_image set and update their current_version
 */
export async function updateVersionsFromPods() {
  const { dbOperations } = await import("./db.js");
  const apps = dbOperations.getAllApps();

  let processedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const app of apps) {
    if (!app.docker_image || !app.k8s_namespace) {
      skippedCount++;
      continue;
    }

    try {
      const version = await getVersionFromPod(
        app.docker_image,
        app.k8s_namespace
      );
      if (version && version !== app.current_version) {
        dbOperations.updateApp(app.id, {
          current_version: version,
        });
        log.info(
          `Updated ${app.name} version from ${app.current_version} to ${version}`
        );
        updatedCount++;
      } else if (version) {
        log.info(
          `App ${app.name} is already at version ${version}, no update needed`
        );
      }
      processedCount++;
    } catch (error) {
      log.error(`Error updating version from pod for ${app.name}:`, error);
    }
  }

  log.info(
    `K8s pod version update completed: ${processedCount} processed, ${updatedCount} updated, ${skippedCount} skipped`
  );
}
