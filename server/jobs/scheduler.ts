/**
 * Generic Job Scheduler for background tasks
 * Provides a unified interface for scheduling, executing, and managing background jobs
 */

import { createLogger } from "../logger.js";

const log = createLogger({ service: "JobScheduler" });

export interface JobConfig {
  /** Unique identifier for the job */
  id: string;
  /** Human-readable name for the job */
  name: string;
  /** Function to execute */
  execute: () => Promise<void> | void;
  /** Interval in milliseconds between executions */
  interval: number;
  /** Whether to run immediately on start */
  runOnStart?: boolean;
  /** Maximum number of retries on failure */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Whether the job is enabled */
  enabled?: boolean;
}

export interface JobStatus {
  id: string;
  name: string;
  lastRun: Date | null;
  nextRun: Date | null;
  isRunning: boolean;
  errorCount: number;
  lastError: Error | null;
  enabled: boolean;
}

export class JobScheduler {
  private jobs: Map<string, JobConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private statuses: Map<string, JobStatus> = new Map();
  private isRunning = false;

  /**
   * Register a new job
   */
  register(config: JobConfig): void {
    if (this.jobs.has(config.id)) {
      throw new Error(`Job with id "${config.id}" is already registered`);
    }

    const job: JobConfig = {
      enabled: true,
      maxRetries: 3,
      retryDelay: 5000,
      runOnStart: false,
      ...config,
    };

    this.jobs.set(config.id, job);
    this.statuses.set(config.id, {
      id: config.id,
      name: config.name,
      lastRun: null,
      nextRun: null,
      isRunning: false,
      errorCount: 0,
      lastError: null,
      enabled: job.enabled ?? true,
    });

    // If scheduler is already running, start this job immediately
    if (this.isRunning && job.enabled) {
      this.startJob(config.id);
    }
  }

  /**
   * Unregister a job
   */
  unregister(jobId: string): void {
    this.stopJob(jobId);
    this.jobs.delete(jobId);
    this.statuses.delete(jobId);
  }

  /**
   * Start a specific job
   */
  private startJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || !job.enabled) {
      return;
    }

    // Stop existing interval if any
    this.stopJob(jobId);

    // Run immediately if configured
    if (job.runOnStart) {
      this.executeJob(jobId).catch((error) => {
        log.error(`Error running job "${job.name}" on start:`, error);
      });
    }

    // Schedule recurring execution
    const interval = setInterval(() => {
      this.executeJob(jobId).catch((error) => {
        log.error(`Error in scheduled execution of job "${job.name}":`, error);
      });
    }, job.interval);

    this.intervals.set(jobId, interval);

    // Update next run time
    const status = this.statuses.get(jobId);
    if (status) {
      status.nextRun = new Date(Date.now() + job.interval);
    }
  }

  /**
   * Stop a specific job
   */
  private stopJob(jobId: string): void {
    const interval = this.intervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobId);
    }

    const status = this.statuses.get(jobId);
    if (status) {
      status.nextRun = null;
    }
  }

  /**
   * Execute a job with retry logic
   */
  private async executeJob(jobId: string, retryCount = 0): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || !job.enabled) {
      return;
    }

    const status = this.statuses.get(jobId);
    if (!status) {
      return;
    }

    // Prevent concurrent execution
    if (status.isRunning) {
      log.warn(`Job "${job.name}" is already running, skipping execution`);
      return;
    }

    status.isRunning = true;
    status.lastRun = new Date();

    try {
      await job.execute();
      // Success - reset error count
      status.errorCount = 0;
      status.lastError = null;
      status.nextRun = new Date(Date.now() + job.interval);
      log.info(`Job "${job.name}" completed successfully`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      status.lastError = err;
      status.errorCount++;

      log.error(`Job "${job.name}" failed (attempt ${retryCount + 1}):`, err);

      // Retry if we haven't exceeded max retries
      const maxRetries = job.maxRetries ?? 3;
      if (retryCount < maxRetries) {
        const retryDelay = job.retryDelay ?? 5000;
        log.info(
          `Retrying job "${job.name}" in ${retryDelay}ms (${
            retryCount + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this.executeJob(jobId, retryCount + 1);
      } else {
        log.error(
          `Job "${job.name}" failed after ${maxRetries} retries. Will retry on next scheduled run.`
        );
      }
    } finally {
      status.isRunning = false;
    }
  }

  /**
   * Manually trigger a job execution
   */
  async trigger(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job with id "${jobId}" not found`);
    }
    log.info(`Manually triggering job "${job.name}"`);
    await this.executeJob(jobId);
  }

  /**
   * Enable a job
   */
  enable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = true;
      const status = this.statuses.get(jobId);
      if (status) {
        status.enabled = true;
      }
      if (this.isRunning) {
        this.startJob(jobId);
      }
      log.info(`Job "${job.name}" enabled`);
    }
  }

  /**
   * Disable a job
   */
  disable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.enabled = false;
      const status = this.statuses.get(jobId);
      if (status) {
        status.enabled = false;
      }
      this.stopJob(jobId);
      log.info(`Job "${job.name}" disabled`);
    }
  }

  /**
   * Get status of a specific job
   */
  getStatus(jobId: string): JobStatus | undefined {
    return this.statuses.get(jobId);
  }

  /**
   * Get status of all jobs
   */
  getAllStatuses(): JobStatus[] {
    return Array.from(this.statuses.values());
  }

  /**
   * Start the scheduler (starts all enabled jobs)
   */
  start(): void {
    if (this.isRunning) {
      log.warn("JobScheduler is already running");
      return;
    }

    this.isRunning = true;
    log.info(`Starting JobScheduler with ${this.jobs.size} registered jobs`);

    let enabledCount = 0;
    for (const jobId of this.jobs.keys()) {
      const job = this.jobs.get(jobId);
      if (job?.enabled) {
        this.startJob(jobId);
        enabledCount++;
      }
    }
    log.info(
      `JobScheduler started successfully with ${enabledCount} enabled job(s)`
    );
  }

  /**
   * Stop the scheduler (stops all jobs)
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    log.info("Stopping JobScheduler");

    for (const jobId of this.intervals.keys()) {
      this.stopJob(jobId);
    }
  }

  /**
   * Shutdown gracefully (waits for running jobs to complete)
   */
  async shutdown(): Promise<void> {
    log.info("Shutting down JobScheduler...");
    this.stop();

    // Wait for any running jobs to complete (with timeout)
    const runningJobs = Array.from(this.statuses.values()).filter(
      (status) => status.isRunning
    );

    if (runningJobs.length > 0) {
      log.info(
        `Waiting for ${runningJobs.length} running job(s) to complete...`
      );
      const timeout = 30000; // 30 seconds
      const startTime = Date.now();

      while (
        runningJobs.some((status) => status.isRunning) &&
        Date.now() - startTime < timeout
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const stillRunning = runningJobs.filter((status) => status.isRunning);
      if (stillRunning.length > 0) {
        log.warn(
          `Warning: ${stillRunning.length} job(s) did not complete within timeout`
        );
      } else {
        log.info("All running jobs completed successfully");
      }
    }

    log.info("JobScheduler shutdown complete");
  }
}

// Export a singleton instance
export const jobScheduler = new JobScheduler();
