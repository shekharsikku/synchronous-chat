import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import env from "./utils/env";

const app = express();

app.use(
  express.json({
    limit: env.PAYLOAD_LIMIT_ALLOWED,
    strict: true,
  })
);

app.use(
  express.urlencoded({
    limit: env.PAYLOAD_LIMIT_ALLOWED,
    extended: true,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const allowedOrigins = env.CORS_ORIGIN;
const origins = allowedOrigins.split(",");

const allowedMethods = env.ALLOWED_METHODS;
const methods = allowedMethods.split(",");

app.use(
  cors({
    origin: origins,
    methods: methods,
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(cookieParser(env.COOKIES_SECRET));
app.use("/public/temp", express.static("/public/temp"));
env.NODE_ENV === "development" ? app.use(morgan("dev")) : null;

app.get("/", (_req: Request, res: Response) => {
  return res
    .status(200)
    .send({ message: "Synchronous Chat by Shekhar Sharma!" });
});

import AuthRouter from "./routers/auth";
import UserRouter from "./routers/user";
import ContactRouter from "./routers/contact";
import MessageRouter from "./routers/message";

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/contact", ContactRouter);
app.use("/api/message", MessageRouter);

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  try {
    console.error(`Error: ${err.message}`);
    return res.status(500).json({ message: "Internal server error!" });
  } catch (error) {
    next(error);
  }
});

export default app;
