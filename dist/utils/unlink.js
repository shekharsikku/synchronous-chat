"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlinkFilesWithExtensions = exports.extensionsToDelete = exports.folderPath = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const folderPath = "./public/temp";
exports.folderPath = folderPath;
const extensionsToDelete = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".pdf",
    ".webp",
    ".svg",
];
exports.extensionsToDelete = extensionsToDelete;
const unlinkFilesWithExtensions = (folderPath, extensions) => {
    (0, fs_1.readdir)(folderPath, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return;
        }
        files.forEach((file) => {
            const filePath = (0, path_1.join)(folderPath, file);
            (0, fs_1.stat)(filePath, (err, stats) => {
                if (err) {
                    console.error("Error getting file stats:", err);
                    return;
                }
                if (stats.isFile()) {
                    const fileExtension = (0, path_1.extname)(filePath);
                    if (extensions.includes(fileExtension)) {
                        (0, fs_1.unlink)(filePath, (err) => {
                            if (err) {
                                console.error("Error deleting file:", err);
                                return;
                            }
                            console.log("File deleted:", filePath);
                        });
                    }
                }
            });
        });
    });
};
exports.unlinkFilesWithExtensions = unlinkFilesWithExtensions;
