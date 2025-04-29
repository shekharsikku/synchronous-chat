"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = require("express-rate-limit");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("./utils/env"));
const routers_1 = __importDefault(require("./routers"));
const app = (0, express_1.default)();
app.use(express_1.default.json({
    limit: env_1.default.PAYLOAD_LIMIT,
    strict: true,
}));
app.use(express_1.default.urlencoded({
    limit: env_1.default.PAYLOAD_LIMIT,
    extended: true,
}));
app.use((0, cors_1.default)({
    origin: env_1.default.CORS_ORIGIN,
    credentials: true,
}));
app.use((0, helmet_1.default)({
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
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)(env_1.default.COOKIES_SECRET));
app.use("/public/temp", express_1.default.static(path_1.default.join(__dirname, "../public/temp")));
if (env_1.default.isDev) {
    app.use((0, morgan_1.default)("dev"));
}
else {
    app.set("trust proxy", 1);
    app.use((0, morgan_1.default)("tiny"));
    app.use(express_1.default.static(path_1.default.join(__dirname, "../client/dist"), {
        maxAge: "30d",
        immutable: true,
    }));
}
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000,
    limit: 200,
    message: { message: "Maximum number of requests exceeded!" },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", limiter, routers_1.default);
app.all("*path", (_req, res) => {
    if (env_1.default.isDev) {
        res.status(200).json({ message: "Welcome to Synchronous Chat!" });
    }
    else {
        res.sendFile(path_1.default.join(__dirname, "../client/dist", "index.html"), {
            headers: {
                "Cache-Control": "no-store, must-revalidate",
            },
        });
    }
});
app.use(((err, _req, res, _next) => {
    console.error(`Error: ${err.message}`);
    res.status(500).json({ message: "Internal Server Error!" });
}));
exports.default = app;
