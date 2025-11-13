/**
 * Generic Logger Utility
 * Provides structured logging with context support
 */

export type LogLevel = "info" | "warn" | "error";

export interface LoggerContext {
  service?: string;
  route?: string;
  file?: string;
  [key: string]: string | undefined;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    context: LoggerContext | string,
    message: string
  ): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);

    // Handle context as string (simple case) or object
    let contextStr: string;
    if (typeof context === "string") {
      contextStr = context;
    } else {
      const parts: string[] = [];
      if (context.service) parts.push(`service:${context.service}`);
      if (context.route) parts.push(`route:${context.route}`);
      if (context.file) parts.push(`file:${context.file}`);
      // Add any additional context properties
      Object.keys(context).forEach((key) => {
        if (!["service", "route", "file"].includes(key) && context[key]) {
          parts.push(`${key}:${context[key]}`);
        }
      });
      contextStr = parts.length > 0 ? `[${parts.join(" ")}]` : "";
    }

    const contextPrefix = contextStr ? `${contextStr} ` : "";
    const formattedMessage = `${timestamp} [${levelUpper}] ${contextPrefix}${message}`;

    return formattedMessage;
  }

  /**
   * Create a logger instance with a specific context
   */
  create(context: LoggerContext | string): {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  } {
    return {
      info: (message: string, ...args: unknown[]) => {
        const formatted = this.formatMessage("info", context, message);
        if (args.length > 0) {
          console.log(formatted, ...args);
        } else {
          console.log(formatted);
        }
      },
      warn: (message: string, ...args: unknown[]) => {
        const formatted = this.formatMessage("warn", context, message);
        if (args.length > 0) {
          console.warn(formatted, ...args);
        } else {
          console.warn(formatted);
        }
      },
      error: (message: string, ...args: unknown[]) => {
        const formatted = this.formatMessage("error", context, message);
        if (args.length > 0) {
          console.error(formatted, ...args);
        } else {
          console.error(formatted);
        }
      },
    };
  }

  /**
   * Log an info message with context
   */
  info(
    context: LoggerContext | string,
    message: string,
    ...args: unknown[]
  ): void {
    const formatted = this.formatMessage("info", context, message);
    if (args.length > 0) {
      console.log(formatted, ...args);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log a warning message with context
   */
  warn(
    context: LoggerContext | string,
    message: string,
    ...args: unknown[]
  ): void {
    const formatted = this.formatMessage("warn", context, message);
    if (args.length > 0) {
      console.warn(formatted, ...args);
    } else {
      console.warn(formatted);
    }
  }

  /**
   * Log an error message with context
   */
  error(
    context: LoggerContext | string,
    message: string,
    ...args: unknown[]
  ): void {
    const formatted = this.formatMessage("error", context, message);
    if (args.length > 0) {
      console.error(formatted, ...args);
    } else {
      console.error(formatted);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience function to create a logger with context
export function createLogger(context: LoggerContext | string) {
  return logger.create(context);
}
