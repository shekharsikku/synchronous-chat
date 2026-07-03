import { readdir, stat, unlink } from "node:fs";
import { join, extname } from "node:path";
import { logger } from "#/middlewares/index.js";

const folderPath = "./public/temp";

const fileExtensions = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".webp", ".svg"];

export const unlinkFiles = (folder = folderPath, extensions = fileExtensions) => {
  readdir(folder, (err, files) => {
    if (err) {
      logger.error({ err }, "Error reading directory!");
      return;
    }

    files.forEach((file) => {
      const filePath = join(folder, file);
      stat(filePath, (err, stats) => {
        if (err) {
          logger.error({ err }, "Error getting file stats!");
          return;
        }

        if (stats.isFile()) {
          const fileExtension = extname(filePath);
          if (extensions.includes(fileExtension)) {
            unlink(filePath, (err) => {
              if (err) {
                logger.error({ err }, "Error deleting file!");
                return;
              }
              logger.info("File deleted: %s", filePath);
            });
          }
        }
      });
    });
  });
};
