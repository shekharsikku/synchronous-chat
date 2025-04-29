"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongodb = async (uri) => {
    try {
        const { connection } = await (0, mongoose_1.connect)(uri);
        return connection.readyState;
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
};
exports.default = mongodb;
