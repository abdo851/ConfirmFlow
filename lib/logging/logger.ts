export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveMinimumLogLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (
    configured === "debug" ||
    configured === "info" ||
    configured === "warn" ||
    configured === "error"
  ) {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel, minimumLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minimumLevel];
}

function formatHumanReadable(entry: LogEntry): string {
  const contextSuffix =
    entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : "";

  return `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}${contextSuffix}`;
}

function writeLog(entry: LogEntry): void {
  const minimumLevel = resolveMinimumLogLevel();
  if (!shouldLog(entry.level, minimumLevel)) {
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const output = isProduction ? JSON.stringify(entry) : formatHumanReadable(entry);

  switch (entry.level) {
    case "debug":
      console.debug(output);
      break;
    case "info":
      console.info(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "error":
      console.error(output);
      break;
  }
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  writeLog({
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  });
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    log("debug", message, context);
  },
  info(message: string, context?: LogContext): void {
    log("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    log("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    log("error", message, context);
  },
};
