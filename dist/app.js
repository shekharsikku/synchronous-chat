import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import requestIp from "request-ip";
import { parse } from "yaml";
import { limiter } from "./middlewares/index.js";
import routers from "./routers/index.js";
import env from "./utils/env.js";
import { HttpError, ErrorResponse, SuccessResponse } from "./utils/response.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { directives } = parse(readFileSync(join(__dirname, "../public/csp.yaml"), "utf-8"));
app.use(helmet({
    contentSecurityPolicy: { directives },
}));
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({
    limit: env.PAYLOAD_LIMIT,
    strict: true,
}));
app.use(express.urlencoded({
    limit: env.PAYLOAD_LIMIT,
    extended: true,
}));
if (env.isDev) {
    app.use(morgan("dev"));
}
else {
    app.set("trust proxy", 1);
    app.use(morgan("tiny"));
    app.use(express.static(join(__dirname, "../client/dist"), {
        maxAge: "30d",
        immutable: true,
    }));
}
app.use(requestIp.mw());
app.use(cookieParser(env.COOKIES_SECRET));
app.use(compression({
    filter: (req, res) => {
        if (req.headers.accept === "text/event-stream") {
            return false;
        }
        return compression.filter(req, res);
    },
}));
app.use("/public/temp", express.static(join(__dirname, "../public/temp")));
app.use("/api", limiter(), routers);
app.all("*path", (_req, res) => {
    if (env.isDev) {
        return SuccessResponse(res, 200, "Welcome to Synchronous Chat!");
    }
    else {
        return res.sendFile(join(__dirname, "../client/dist", "index.html"), {
            headers: {
                "Cache-Control": "no-store, must-revalidate",
            },
        });
    }
});
app.use(((err, _req, res, next) => {
    if (res.headersSent)
        return next(err);
    if (err instanceof HttpError) {
        return ErrorResponse(res, err.code || 500, err.message || "Unknown error occurred!");
    }
    const message = err.message || "Internal server error!";
    console.error(`Error: ${message}`);
    return ErrorResponse(res, 500, message);
}));
export default app;
