import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  /**
   * Get client IP address from request
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Format request duration in milliseconds
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Determine log level based on status code
   */
  private getLogLevel(statusCode: number): "info" | "warn" | "error" {
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warn";
    return "info";
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip logging for health check endpoint
    if (request.path === "/healthz") {
      return next.handle();
    }

    const startTime = Date.now();
    const method = request.method;
    const path = request.path;
    const ip = this.getClientIp(request);

    // Log query parameters if present
    if (Object.keys(request.query).length > 0) {
      this.logger.log(`Query params: ${JSON.stringify(request.query)}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const logLevel = this.getLogLevel(statusCode);

          const message = `${method} ${path} - ${statusCode} - ${this.formatDuration(
            duration
          )} - IP: ${ip}`;

          // Log with appropriate level
          if (logLevel === "error") {
            this.logger.error(message);
          } else if (logLevel === "warn") {
            this.logger.warn(message);
          } else {
            this.logger.log(message);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;
          const message = `${method} ${path} - ${statusCode} - ${this.formatDuration(
            duration
          )} - IP: ${ip}`;
          this.logger.error(
            `${message} - ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        },
      })
    );
  }
}
