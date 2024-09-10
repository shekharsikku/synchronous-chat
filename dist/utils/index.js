"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ApiResponse = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(code, message, stack = "") {
        super(message);
        this.code = code;
        this.message = message;
        this.stack = stack;
    }
}
exports.ApiError = ApiError;
const ApiResponse = (_req, res, code, message, data = null) => {
    const success = code < 400 ? true : false;
    const response = { code, success, message };
    if (data)
        response.data = data;
    return res.status(code).send(Object.assign({}, response));
};
exports.ApiResponse = ApiResponse;
const ValidationError = (error) => {
    return error.errors.map((err) => ({
        path: err.path.join(", "),
        message: err.message,
    }));
};
exports.ValidationError = ValidationError;
