"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessResponse = exports.ErrorResponse = exports.HttpError = void 0;
class HttpError extends Error {
    code;
    message;
    constructor(code, message, stack = "") {
        super(message);
        this.code = code;
        this.message = message;
        this.stack = stack;
    }
}
exports.HttpError = HttpError;
const ErrorResponse = (res, code, message, error = null) => {
    const response = { success: false, message };
    if (error)
        response.error = error;
    res.status(code).json(response);
};
exports.ErrorResponse = ErrorResponse;
const SuccessResponse = (res, code, message, data = null) => {
    const response = { success: true, message };
    if (data)
        response.data = data;
    res.status(code).json(response);
};
exports.SuccessResponse = SuccessResponse;
