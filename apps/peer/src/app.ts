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

app.use("/api", limiter(), router);

app.get("/", (_req, res) => {
  if (env.isDev) {
    return HttpResponse.success(res, 200, "Welcome to Synchronous Peer!");
  }

  return res.status(308).redirect(env.REDIRECT_URL);
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
