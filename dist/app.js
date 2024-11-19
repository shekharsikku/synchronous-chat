"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
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
        },
    },
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)(env_1.default.COOKIES_SECRET));
app.use("/public/temp", express_1.default.static(path_1.default.join(__dirname, "../public/temp")));
const isDevelopment = env_1.default.NODE_ENV === "development";
/** Morgan logging middleware */
if (isDevelopment) {
    app.use((0, morgan_1.default)("dev"));
}
else {
    app.use((0, morgan_1.default)("tiny"));
    app.use(express_1.default.static(path_1.default.join(__dirname, "../client/dist")));
}
/** Api routers middleware */
app.use("/api", routers_1.default);
app.all("*path", (_req, res) => {
    if (isDevelopment) {
        res.status(200).send({ message: "Welcome to Synchronous Chat!" });
    }
    else {
        res.sendFile(path_1.default.join(__dirname, "../client/dist", "index.html"));
    }
});
app.use(((err, _req, res, _next) => {
    console.error(`Error: ${err.message}`);
    res.status(500).json({ message: "Internal server error!" });
}));
exports.default = app;
