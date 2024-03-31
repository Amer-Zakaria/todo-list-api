import { format, createLogger, transports } from "winston";
const { timestamp, combine, errors, json, printf } = format;

const logger = createLogger({
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new transports.File({
      filename: "error.log",
      level: "error",
    }),
    new transports.File({ filename: "combined.log" }),
  ],
  exceptionHandlers: [new transports.File({ filename: "error.log" })],
});

export default function buildProdLogger() {
  return logger;
}

module.exports = buildProdLogger;
