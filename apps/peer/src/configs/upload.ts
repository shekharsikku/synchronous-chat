import multer from "multer";
import { HttpError } from "#/utilities/response.js";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new HttpError(422, "Only image files are allowed!"));
    }
  },
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;
