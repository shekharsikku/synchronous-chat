import express from "express";
import requestIp from "request-ip";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import env from "./utils/env.js";
import routers from "./routers/index.js";
import { HttpError, ErrorResponse, SuccessResponse } from "./utils/index.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "res.cloudinary.com", "data:", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "wss://0.peerjs.com", "https://0.peerjs.com"],
        },
    },
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
app.use(compression());
app.use("/public/temp", express.static(join(__dirname, "../public/temp")));
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, _res) => {
        return req.clientIp;
    },
    handler: (req, _res, _next) => {
        console.error(`Rate limit exceeded for IP: ${req.clientIp}`);
        throw new HttpError(429, "Maximum number of requests exceeded!");
    },
});
app.use("/api", limiter, routers);
app.all("*path", (_req, res) => {
    if (env.isDev) {
        return SuccessResponse(res, 200, "Welcome to Synchronous Chat!");
    }
    else {
        res.sendFile(join(__dirname, "../client/dist", "index.html"), {
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
