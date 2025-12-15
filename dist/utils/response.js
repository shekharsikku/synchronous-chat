class HttpError extends Error {
    code;
    constructor(code, message, stack = "") {
        super(message);
        this.code = code;
        this.message = message;
        this.stack = stack;
    }
}
const ErrorResponse = (res, code, message, error) => {
    const response = { success: false, message };
    if (error !== undefined)
        response.error = error;
    return res.status(code).json(response);
};
const SuccessResponse = (res, code, message, data) => {
    const response = { success: true, message };
    if (data !== undefined)
        response.data = data;
    return res.status(code).json(response);
};
export { HttpError, ErrorResponse, SuccessResponse };
