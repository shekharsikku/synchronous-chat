"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const env_1 = __importDefault(require("./utils/env"));
const app = (0, express_1.default)();
app.use(express_1.default.json({
    limit: env_1.default.PAYLOAD_LIMIT_ALLOWED,
    strict: true,
}));
app.use(express_1.default.urlencoded({
    limit: env_1.default.PAYLOAD_LIMIT_ALLOWED,
    extended: true,
}));
app.use(body_parser_1.default.urlencoded({
    extended: true,
}));
const allowedOrigins = env_1.default.CORS_ORIGIN;
const origins = allowedOrigins.split(",");
const allowedMethods = env_1.default.ALLOWED_METHODS;
const methods = allowedMethods.split(",");
app.use((0, cors_1.default)({
    origin: origins,
    methods: methods,
    credentials: true,
    optionsSuccessStatus: 204,
}));
app.use((0, cookie_parser_1.default)(env_1.default.COOKIES_SECRET));
app.use("/public/temp", express_1.default.static("/public/temp"));
env_1.default.NODE_ENV === "development" ? app.use((0, morgan_1.default)("dev")) : null;
app.get("/", (_req, res) => {
    return res
        .status(200)
        .send({ message: "Synchronous Chat by Shekhar Sharma!" });
});
const auth_1 = __importDefault(require("./routers/auth"));
const user_1 = __importDefault(require("./routers/user"));
const contact_1 = __importDefault(require("./routers/contact"));
const message_1 = __importDefault(require("./routers/message"));
app.use("/api/auth", auth_1.default);
app.use("/api/user", user_1.default);
app.use("/api/contact", contact_1.default);
app.use("/api/message", message_1.default);
app.use((err, _req, res, next) => {
    try {
        console.error(`Error: ${err.message}`);
        return res.status(500).json({ message: "Internal server error!" });
    }
    catch (error) {
        next(error);
    }
});
exports.default = app;
