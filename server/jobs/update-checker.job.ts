/**
 * Update Checker Job
 * Checks for available updates for all apps periodically
 */

import { jobScheduler } from "./scheduler.js";
import { checkForUpdates } from "../update-checker.js";

/**
 * Register the update checker job with the scheduler
 * This function should be called during server initialization
 */
export function registerUpdateCheckerJob() {
  jobScheduler.register({
    id: "update-checker",
    name: "Update Checker",
    execute: async () => {
      await checkForUpdates();
    },
    interval: 6 * 60 * 60 * 1000, // 6 hours
    runOnStart: true,
    maxRetries: 3,
    retryDelay: 5000,
  });
}
