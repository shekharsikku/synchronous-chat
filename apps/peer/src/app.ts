import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { MulterError } from "multer";
import { pinoHttp } from "pino-http";
import requestIp from "request-ip";
import env from "#/configs/env.js";
import limiter from "#/configs/limiter.js";
import logger from "#/configs/logger.js";
import router from "#/routers/index.js";
import { HttpError, HttpResponse } from "#/utilities/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

if (env.isProd) {
  app.set("trust proxy", 1);
}

app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    maxAge: 86400,
  })
);

app.use(requestIp.mw());

app.use(cookieParser());

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

const __static = resolve(__dirname, "../public");

if (env.isProd) {
  app.use(
    express.static(__static, {
      maxAge: "30d",
      immutable: true,
    })
  );
}

app.use("/api", limiter(), router);

app.get("/", (_req, res) => {
  if (env.isDev) {
    return HttpResponse.success(res, 200, "Welcome to Synchronous Peer!");
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
