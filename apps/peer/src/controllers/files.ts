import { filesService } from "#/services/files.js";
import { requireUser } from "#/utilities/helpers.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";

export const uploadFile = asyncHandler(async (req, res) => {
  const fileData = req.file;
  const userId = requireUser(req);

  if (!fileData) {
    throw new HttpError(400, "Invalid file for upload!");
  }

  const uploadResult = await filesService.uploadFile(fileData, userId);

  return HttpResponse.success(res, 200, "File uploaded successfully!", {
    id: uploadResult._id.toString(),
    ...uploadResult.metadata?.["dimensions"],
  });
});

export const getFile = asyncHandler<{ fid: string }, any, any, { action: string }>(async (req, res, next) => {
  const fileId = req.params.fid;
  const action = req.query.action;

  const { fileData, objectId } = await filesService.getFile(fileId);

  const etag = `"${fileData._id.toString("base64")}"`;

  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  const fileStream = await filesService.getStream(objectId);

  const disposition = action === "download" ? "attachment" : "inline";
  const filename = encodeURIComponent(fileData.filename);

  res.set({
    "Content-Type": fileData.metadata?.["contentType"] || "application/octet-stream",
    "Content-Disposition": `${disposition}; filename="${filename}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
  });

  fileStream.once("error", (err) => {
    if (!res.headersSent) {
      return next(new HttpError(500, "Failed to stream file!"));
    }
    return res.destroy(err);
  });

  return fileStream.pipe(res);
});

export const deleteFile = asyncHandler<{ fid: string }>(async (req, res) => {
  const fileId = req.params.fid;
  const userId = requireUser(req);

  await filesService.deleteFile(fileId, userId);

  return HttpResponse.success(res, 200, "File deleted successfully!");
});
