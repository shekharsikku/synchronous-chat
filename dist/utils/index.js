"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = exports.ApiError = void 0;
class ApiError extends Error {
    code;
    message;
    constructor(code, message, stack = "") {
        super(message);
        this.code = code;
        this.message = message;
        this.stack = stack;
    }
}
exports.ApiError = ApiError;
const ApiResponse = (res, code, message, data = null, error = null) => {
    const success = code < 400;
    const response = { success, message };
    if (data)
        response.data = data;
    if (error)
        response.error = error;
    res.status(code).json(response);
};
exports.ApiResponse = ApiResponse;
