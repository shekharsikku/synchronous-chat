import { readdir, stat, unlink } from "node:fs";
import { join, extname } from "node:path";
import logger from "#/middlewares/logger.js";

const folderPath = "./public/temp";

const extensionsToDelete = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".webp", ".svg"];

const unlinkFilesWithExtensions = (folderPath: string, extensions: string[]) => {
  readdir(folderPath, (err, files) => {
    if (err) {
      logger.error({ err }, "Error reading directory!");
      return;
    }

    files.forEach((file) => {
      const filePath = join(folderPath, file);
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

export { folderPath, extensionsToDelete, unlinkFilesWithExtensions };
