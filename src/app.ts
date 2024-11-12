import express, {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import env from "./utils/env";
import {
  AuthRouter,
  UserRouter,
  ContactRouter,
  MessageRouter,
} from "./routers";

const app = express();

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
      },
    },
  })
);
app.use(compression());
app.use(cookieParser(env.COOKIES_SECRET));
app.use("/public/temp", express.static(path.join(__dirname, "../public/temp")));

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/contact", ContactRouter);
app.use("/api/message", MessageRouter);

if (env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
}

app.all("*path", (_req: Request, res: Response) => {
  if (env.NODE_ENV === "development") {
    res.status(200).send({ message: "Welcome to Synchronous Chat!" });
  } else {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  }
});

app.use(((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ message: "Internal server error!" });
}) as ErrorRequestHandler);

export default app;
