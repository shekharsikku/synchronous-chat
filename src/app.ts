import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { MulterError } from "multer";
import { pinoHttp } from "pino-http";
import requestIp from "request-ip";
import webpush from "web-push";
import { ZodError } from "zod";
import configs from "#/configs/cfg.json" with { type: "json" };
import env from "#/configs/env.js";
import limiter from "#/configs/limiter.js";
import logger from "#/configs/logger.js";
import routers from "#/routers/index.js";
import { HttpError, HttpResponse } from "#/utilities/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

webpush.setVapidDetails(env.VAPID_MAILTO, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

const app = express();

if (env.isProd) {
  app.set("trust proxy", 1);
}

app.use(pinoHttp({ logger }));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: configs.directives,
    },
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    maxAge: 3600,
  })
);

app.use(requestIp.mw());

app.use(cookieParser(env.COOKIES_SECRET));

app.use(
  express.json({
    limit: env.BODY_LIMIT,
    strict: true,
  })
);

app.use(
  express.urlencoded({
    limit: env.BODY_LIMIT,
    extended: true,
  })
);

app.use(
  compression({
    filter: (req, res) => {
      if (req.headers.accept === "text/event-stream") return false;
      return compression.filter(req, res);
    },
  })
);

app.use("/public/temp", express.static(resolve(__dirname, "../public/temp")));

const __static = resolve(__dirname, "../client/dist");

if (env.isProd) {
  app.use(
    express.static(__static, {
      maxAge: "30d",
      immutable: true,
    })
  );
}

app.use("/api", limiter(), routers);

app.all("*path", (_req, res) => {
  if (env.isDev) {
    return HttpResponse.success(res, 200, "Welcome to Synchronous Chat!");
  }

  return res.sendFile(
    join(__static, "index.html"),
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    },
    (err) => {
      if (err && !res.headersSent) {
        return HttpResponse.error(res, 404, "Static file not found!");
      }
    }
  );
});

app.use(((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    return HttpResponse.error(res, 400, "Validation error occurred!", err.issues);
  }

  if (err instanceof MulterError) {
    return HttpResponse.error(res, err.code === "LIMIT_FILE_SIZE" ? 413 : 400, `${err.message}!`);
  }

  if (err instanceof HttpError) {
    return HttpResponse.error(res, err.code, err.message);
  }

  req.log.error({ err }, "Unhandled server error!");
  return HttpResponse.error(res, 500, "Internal server error!");
}) as ErrorRequestHandler);

export default app;
