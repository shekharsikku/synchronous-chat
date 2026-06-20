import type { NextFunction, Request, Response } from "express";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { MulterError } from "multer";
import { pinoHttp } from "pino-http";
import requestIp from "request-ip";
import webpush from "web-push";
import { parse } from "yaml";
import { ZodError } from "zod";
import { limiter, logger } from "#/middlewares/index.js";
import routers from "#/routers/index.js";
import env from "#/utilities/env.js";
import { HttpError, HttpResponse } from "#/utilities/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { directives } = parse(readFileSync(join(__dirname, "../public/csp.yaml"), "utf-8"));

webpush.setVapidDetails(env.VAPID_MAILTO, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

const app = express();

/** Trust Proxy */
if (env.isProd) {
  app.set("trust proxy", 1);
}

/** Logging  */
app.use(pinoHttp({ logger }));

/** Security */
app.use(helmet({ contentSecurityPolicy: { directives } }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(requestIp.mw());

/** Parsing */
app.use(cookieParser(env.COOKIES_SECRET));
app.use(express.json({ limit: env.PAYLOAD_LIMIT, strict: true }));
app.use(express.urlencoded({ limit: env.PAYLOAD_LIMIT, extended: true }));

/** Compression */
app.use(
  compression({
    filter: (req: Request, res: Response) => {
      if (req.headers.accept === "text/event-stream") return false;
      return compression.filter(req, res);
    },
  })
);

/** Static Files */
if (env.isProd) {
  app.use(
    express.static(join(__dirname, "../client/dist"), {
      maxAge: "30d",
      immutable: true,
    })
  );
}

app.use("/public/temp", express.static(join(__dirname, "../public/temp")));

/** API Routes */
app.use("/api", limiter(), routers);

/** SPA Fallback */
app.all("*path", (_req: Request, res: Response) => {
  if (env.isDev) {
    return new HttpResponse(200, "Welcome to Synchronous Chat!").send(res);
  }

  return res.sendFile(join(__dirname, "../client/dist", "index.html"), {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
});

/** Error Handler */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    return new HttpResponse(400, "Validation error occurred!", { error: err.issues }).send(res);
  }

  if (err instanceof MulterError) {
    return new HttpResponse(400, err.message).send(res);
  }

  if (err instanceof HttpError) {
    return new HttpResponse(err.code, err.message).send(res);
  }

  req.log.error({ err }, "Unhandled server error!");
  return new HttpResponse(500, "Internal server error!").send(res);
});

export default app;
