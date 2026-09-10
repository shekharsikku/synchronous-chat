import { Readable } from "node:stream";
import { GridFSBucket, MongoClient, ObjectId, ServerApiVersion, type GridFSFile } from "mongodb";
import sharp from "sharp";
import env from "#/configs/env.js";
import logger from "#/configs/logger.js";
import { HttpError } from "#/utilities/response.js";

class FilesService {
  private mongo: MongoClient;
  private bucket: GridFSBucket;

  constructor(mongodbUrl: string, bucketName: string) {
    this.mongo = new MongoClient(mongodbUrl, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    this.mongo.on("open", () => {
      logger.info("Mongo connection success!");
    });

    this.mongo.on("error", (err) => {
      logger.error({ err }, "Mongo connection error!");
    });

    const database = this.mongo.db();

    this.bucket = new GridFSBucket(database, {
      bucketName,
      chunkSizeBytes: 1024 * 1024,
    });
  }

  async connect() {
    return await this.mongo.connect();
  }

  private createId(fileId: string) {
    if (!ObjectId.isValid(fileId)) {
      throw new HttpError(400, "Invalid file id!");
    }

    return new ObjectId(fileId);
  }

  private async findFile(objectId: ObjectId) {
    const fileData = await this.bucket.find({ _id: objectId }).next();

    if (!fileData) {
      throw new HttpError(404, "File not found!");
    }

    return fileData;
  }

  async uploadFile(fileData: Express.Multer.File, userId: string) {
    const imageMeta = await sharp(fileData.buffer).metadata();
    const readableStream = Readable.from(fileData.buffer);

    const uploadStream = this.bucket.openUploadStream(fileData.originalname, {
      metadata: {
        contentType: fileData.mimetype,
        fileOwner: userId,
        dimensions: {
          width: imageMeta.width,
          height: imageMeta.height,
        },
      },
    });

    readableStream.pipe(uploadStream);

    return await new Promise<GridFSFile>((resolve, reject) => {
      uploadStream.on("finish", () => {
        if (!uploadStream.gridFSFile) {
          return reject(new HttpError(500, "Failed to upload file!"));
        }
        resolve(uploadStream.gridFSFile);
      });

      uploadStream.on("error", (err) => {
        logger.error({ err }, "File upload error!");
        reject(new HttpError(500, "Failed to upload file!"));
      });
    });
  }

  async getFile(fileId: string) {
    const objectId = this.createId(fileId);

    const fileData = await this.findFile(objectId);

    const fileStream = this.bucket.openDownloadStream(objectId);

    return { fileData, fileStream };
  }

  async deleteFile(fileId: string, userId: string) {
    const objectId = this.createId(fileId);

    const fileData = await this.findFile(objectId);

    if (fileData.metadata?.["fileOwner"] !== userId) {
      throw new HttpError(403, "File deletion is not permitted!");
    }

    await this.bucket.delete(objectId);

    return fileData;
  }

  async deleteOlder(date: Date) {
    const query = { uploadDate: { $lt: date } };

    const cursor = this.bucket.find(query);

    let count = 0;

    for await (const file of cursor) {
      await this.bucket.delete(file._id);
      count++;
    }

    return { count };
  }
}

export const filesService = new FilesService(env.MONGODB_URL, env.BUCKET_NAME);
