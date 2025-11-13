/**
 * Kubernetes Pod Version Updater Job
 * Updates app versions from running Kubernetes pods periodically
 */

import { jobScheduler } from "./scheduler.js";
import { updateVersionsFromPods } from "../k8s-pod.js";

/**
 * Register the Kubernetes pod version updater job with the scheduler
 * This function should be called during server initialization
 */
export function registerK8sPodVersionUpdaterJob() {
  jobScheduler.register({
    id: "k8s-pod-version-updater",
    name: "Kubernetes Pod Version Updater",
    execute: async () => {
      await updateVersionsFromPods();
    },
    interval: 5 * 60 * 1000, // 5 minutes
    runOnStart: true,
    maxRetries: 3,
    retryDelay: 5000,
  });
}
