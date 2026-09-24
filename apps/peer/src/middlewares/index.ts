import { createHash, createSecretKey } from "node:crypto";
import { jwtVerify } from "jose";
import { asyncHandler, HttpResponse } from "#/utilities/response.js";
import env from "#/configs/env.js";

const accessSecret = createSecretKey(createHash("sha256").update(env.ACCESS_SECRET).digest());

export const authUser = asyncHandler(async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      throw new Error("Missing authorization token!");
    }

    const { payload } = await jwtVerify<{ uid: string }>(accessToken, accessSecret, {
      algorithms: ["HS256"],
    });

    req.user = payload.uid;
    next();
  } catch (err) {
    req.log.debug({ err }, "Authorization error!");
    return HttpResponse.error(res, 401, "Unauthorized request!");
  }
});
