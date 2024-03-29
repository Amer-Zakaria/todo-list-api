import { format, createLogger, transports } from "winston";
const { timestamp, combine, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `\n[${timestamp}]\n${level}: ${stack || message}`;
});

export default function buildDevLogger() {
  return createLogger({
    level: "info",
    format: combine(
      format.colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      errors({ stack: true }),
      logFormat
    ),
    transports: [new transports.Console()],
    exceptionHandlers: [new transports.Console()],
  });
}
