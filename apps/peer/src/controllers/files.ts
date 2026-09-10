import { filesService } from "#/services/files.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";

export const uploadFile = asyncHandler<any, any, any, { uid: string }>(async (req, res) => {
  const fileData = req.file;
  const userId = req.query.uid;

  if (!fileData) {
    throw new HttpError(400, "Invalid file for upload!");
  }

  if (!userId) {
    throw new HttpError(400, "User id required!");
  }

  const uploadResult = await filesService.uploadFile(fileData, userId);

  return HttpResponse.success(res, 200, "File uploaded successfully!", uploadResult);
});

export const getFile = asyncHandler<{ fid: string }, any, any, { action: string }>(async (req, res, next) => {
  const fileId = req.params.fid;
  const action = req.query.action;

  const { fileData, fileStream } = await filesService.getFile(fileId);

  const disposition = action === "download" ? "attachment" : "inline";
  const filename = encodeURIComponent(fileData.filename);

  res.set({
    "Content-Type": fileData.metadata?.["contentType"] || "application/octet-stream",
    "Content-Disposition": `${disposition}; filename="${filename}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: fileData._id.toString(),
  });

  fileStream.once("error", (err) => {
    if (!res.headersSent) {
      return next(new HttpError(500, "Failed to stream file!"));
    }
    return res.destroy(err);
  });

  return fileStream.pipe(res);
});

export const deleteFile = asyncHandler<{ fid: string }, any, any, { uid: string }>(async (req, res) => {
  const fileId = req.params.fid;
  const userId = req.query.uid;

  const deleteResult = await filesService.deleteFile(fileId, userId);

  return HttpResponse.success(res, 200, "File deleted successfully!", deleteResult);
});
