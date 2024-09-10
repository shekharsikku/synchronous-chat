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

const corsOrigin = env.CORS_ORIGIN;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(cookieParser(env.COOKIES_SECRET));
app.use("/public/temp", express.static("/public/temp"));
env.NODE_ENV === "development" ? app.use(morgan("dev")) : null;

import AuthRouter from "./routers/auth";
import UserRouter from "./routers/user";
import ContactRouter from "./routers/contact";
import MessageRouter from "./routers/message";

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/contact", ContactRouter);
app.use("/api/message", MessageRouter);

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (_req: Request, res: Response) => {
  if (env.NODE_ENV === "development") {
    res.status(200).send({ message: "Welcome to Synchronous Chat!" });
  } else {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  }
});

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  try {
    console.error(`Error: ${err.message}`);
    return res.status(500).json({ message: "Internal server error!" });
  } catch (error) {
    next(error);
  }
});

export default app;
