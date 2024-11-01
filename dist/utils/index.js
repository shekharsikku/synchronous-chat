"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(code, message, stack = "") {
        super(message);
        this.code = code;
        this.message = message;
        this.stack = stack;
    }
}
exports.ApiError = ApiError;
const ApiResponse = (res, code, message, data = null, error = null) => {
    const success = code < 400 ? true : false;
    const response = { code, success, message };
    if (data)
        response.data = data;
    if (error)
        response.error = error;
    res.status(code).send(Object.assign({}, response));
};
exports.ApiResponse = ApiResponse;
