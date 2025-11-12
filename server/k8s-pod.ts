import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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
    // Try to find pods with a more specific query in the specified namespace
    const command = `kubectl get pods -n ${namespace} -o json`;

    const { stdout } = await execAsync(command);
    const pods = JSON.parse(stdout);

    if (!pods.items || pods.items.length === 0) {
      return null;
    }

    // Extract image name and tag from dockerImage
    const imageParts = dockerImage.split(":");
    const imageName = imageParts[0];
    const imageTag = imageParts[1] || "latest";

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
          return containerImageTag;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(
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

  for (const app of apps) {
    if (!app.docker_image || !app.k8s_namespace) {
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
        console.log(
          `Updated ${app.name} version from ${app.current_version} to ${version}`
        );
      }
    } catch (error) {
      console.error(`Error updating version from pod for ${app.name}:`, error);
    }
  }
}
