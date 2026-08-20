import { extname } from "node:path";
import multer from "multer";
import { HttpError } from "#/utilities/response.js";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, "./public/temp");
    },
    filename: (_req, file, cb) => {
      cb(null, Date.now() + extname(file.originalname));
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new HttpError(422, "Only image files are allowed!"));
    }
  },
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
