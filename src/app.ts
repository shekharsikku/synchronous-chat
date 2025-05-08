import express, {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import env from "./utils/env.js";
import routers from "./routers/index.js";
import { HttpError, ErrorResponse, SuccessResponse } from "./utils/index.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(
  express.json({
    limit: env.PAYLOAD_LIMIT,
    strict: true,
  })
);

app.use(
  express.urlencoded({
    limit: env.PAYLOAD_LIMIT,
    extended: true,
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "res.cloudinary.com",
          "data:",
          "https://cdn.jsdelivr.net",
        ],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "wss://0.peerjs.com", "https://0.peerjs.com"],
      },
    },
  })
);
app.use(compression());
app.use(cookieParser(env.COOKIES_SECRET));
app.use("/public/temp", express.static(path.join(__dirname, "../public/temp")));

/** Morgan logging middleware */
if (env.isDev) {
  app.use(morgan("dev"));
} else {
  app.set("trust proxy", 1);
  app.use(morgan("tiny"));
  app.use(
    express.static(path.join(__dirname, "../client/dist"), {
      maxAge: "30d",
      immutable: true,
    })
  );
}

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  message: { message: "Maximum number of requests exceeded!" },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Rate limiter & Api routers middleware */
app.use("/api", limiter, routers);

app.all("*path", (_req: Request, res: Response) => {
  if (env.isDev) {
    return SuccessResponse(res, 200, "Welcome to Synchronous Chat!");
  } else {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"), {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  }
});

app.use(((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return ErrorResponse(
      res,
      err.code || 500,
      err.message || "Internal server error!"
    );
  }

  const fallback = env.isProd
    ? "Something went wrong!"
    : "Unknown error occurred!";

  const message = err.message || fallback;

  console.error(`Error: ${message}`);

  return ErrorResponse(res, 500, message);
}) as ErrorRequestHandler);

export default app;
