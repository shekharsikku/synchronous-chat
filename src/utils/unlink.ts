import { readdir, stat, unlink } from "fs";
import { join, extname } from "path";

const folderPath = "./public/temp";

const extensionsToDelete = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".webp", ".svg"];

const unlinkFilesWithExtensions = (folderPath: string, extensions: string[]) => {
  readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = join(folderPath, file);
      stat(filePath, (err, stats) => {
        if (err) {
          console.error("Error getting file stats:", err);
          return;
        }

        if (stats.isFile()) {
          const fileExtension = extname(filePath);
          if (extensions.includes(fileExtension)) {
            unlink(filePath, (err) => {
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

export { folderPath, extensionsToDelete, unlinkFilesWithExtensions };
