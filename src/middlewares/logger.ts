import pino from "pino";
import env from "#/utils/env.js";

const otherOptions = env.isDev ? { transport: { target: "pino-pretty", options: { colorize: true } } } : { base: null };

const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.cookie", "res.headers['set-cookie']", "res.headers['content-security-policy']"],
    remove: true,
  },
  msgPrefix: "[SYNCHRONOUS] ",
  ...otherOptions,
});

export default logger;
