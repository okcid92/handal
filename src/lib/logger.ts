type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  event: string;
  message?: string;
  meta?: Record<string, unknown>;
};

function writeLog(payload: LogPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const line = JSON.stringify(entry);

  if (payload.level === "error") {
    console.error(line);
    return;
  }

  if (payload.level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) =>
    writeLog({ level: "info", event, meta }),
  warn: (event: string, message: string, meta?: Record<string, unknown>) =>
    writeLog({ level: "warn", event, message, meta }),
  error: (event: string, message: string, meta?: Record<string, unknown>) =>
    writeLog({ level: "error", event, message, meta }),
};
