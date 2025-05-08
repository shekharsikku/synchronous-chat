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
const ErrorResponse = (res, code, message, error = null) => {
    const response = { success: false, message };
    if (error)
        response.error = error;
    res.status(code).json(response);
};
const SuccessResponse = (res, code, message, data = null) => {
    const response = { success: true, message };
    if (data)
        response.data = data;
    res.status(code).json(response);
};
export { HttpError, ErrorResponse, SuccessResponse };
