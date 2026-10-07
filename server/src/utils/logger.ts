type LogData = Record<string, unknown>;
function write(level: "info" | "warn" | "error", message: string, data?: LogData): void {
  const record = { timestamp: new Date().toISOString(), level, message, ...data };
  const output = JSON.stringify(record);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}
export const logger = {
  info: (message: string, data?: LogData) => write("info", message, data),
  warn: (message: string, data?: LogData) => write("warn", message, data),
  error: (message: string, data?: LogData) => write("error", message, data),
};
