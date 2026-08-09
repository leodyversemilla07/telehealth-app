type LogLevel = "debug" | "info" | "warn" | "error"

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function minLevel(): LogLevel {
  // Read per-call so tests (and hot reloads) can flip NODE_ENV without a
  // fresh module evaluation. Injected as a constant at build time in prod.
  return process.env.NODE_ENV === "production" ? "warn" : "debug"
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel()]
}

function formatMessage(level: LogLevel, tag: string, message: string): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level.toUpperCase()}] [${tag}] ${message}`
}

export function createLogger(tag: string) {
  return {
    debug(message: string, ...args: unknown[]) {
      if (shouldLog("debug")) {
        console.debug(formatMessage("debug", tag, message), ...args)
      }
    },
    info(message: string, ...args: unknown[]) {
      if (shouldLog("info")) {
        console.info(formatMessage("info", tag, message), ...args)
      }
    },
    warn(message: string, ...args: unknown[]) {
      if (shouldLog("warn")) {
        console.warn(formatMessage("warn", tag, message), ...args)
      }
    },
    error(message: string, ...args: unknown[]) {
      if (shouldLog("error")) {
        console.error(formatMessage("error", tag, message), ...args)
      }
    },
  }
}
