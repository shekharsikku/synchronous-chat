import type { Response } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import { jwtVerify } from "jose";
import { Types } from "mongoose";
import { User } from "#/models/index.js";
import { logger } from "#/middlewares/index.js";
import env from "#/utilities/env.js";
import { generateHash, refreshSecret, decryptAuth } from "#/utilities/crypto.js";
import { cookieOptions, generateAccess, generateRefresh, createUserInfo } from "#/utilities/helpers.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";
import type { SignUp, SignIn } from "#/utilities/schema.js";

const parseAuthKey = (token: string) => {
  const { uid, aid } = decryptAuth(token);

  if (!Types.ObjectId.isValid(uid) || !Types.ObjectId.isValid(aid)) {
    throw new Error("Invalid authentication key!");
  }

  return { userId: new Types.ObjectId(uid), authId: new Types.ObjectId(aid) };
};

export const revokeToken = async (res: Response, token: string) => {
  try {
    const { userId, authId } = parseAuthKey(token);

    await User.updateOne(
      {
        _id: userId,
        authentication: {
          $elemMatch: { _id: authId },
        },
      },
      {
        $pull: {
          authentication: { _id: authId },
        },
      }
    );
  } catch (err) {
    logger.error({ err }, "Unknown error occurred!");
  } finally {
    res.clearCookie("access", cookieOptions);
    res.clearCookie("refresh", cookieOptions);
    res.clearCookie("current", cookieOptions);
  }
};

export const signUpUser = asyncHandler<{}, {}, SignUp>(async (req, res) => {
  const { email, password } = req.body;

  const existsEmail = await User.exists({ email });

  if (existsEmail) {
    throw new HttpError(409, "Email already exists!");
  }

  const hashSalt = await genSalt(12);
  const hashed = await hash(password, hashSalt);

  const newUser = await User.create({ email, password: hashed });
  const userInfo = createUserInfo(newUser);
  await generateAccess(res, userInfo);

  return new HttpResponse(201, "Signed up successfully!", { data: userInfo });
});

export const signInUser = asyncHandler<{}, {}, SignIn>(async (req, res) => {
  const deviceId = req.headers["x-device-id"] as string;
  const { email, password, username } = req.body;
  const conditions = [];

  if (email) {
    conditions.push({ email });
  } else if (username) {
    conditions.push({ username });
  } else {
    throw new HttpError(400, "Email or Username required!");
  }

  const existsUser = await User.findOne({
    $or: conditions,
  }).select("+password +authentication");

  if (!existsUser || !(await compare(password, existsUser.password))) {
    throw new HttpError(401, "Invalid credentials!");
  }

  const userInfo = createUserInfo(existsUser);
  await generateAccess(res, userInfo);

  if (!userInfo.setup) {
    return new HttpResponse(200, "Complete your profile!", { data: userInfo });
  }

  const authorizeId = new Types.ObjectId();
  const refreshToken = await generateRefresh(res, userInfo._id, authorizeId, deviceId);
  const hashedRefresh = generateHash(refreshToken);
  const refreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);

  existsUser.authentication?.push({
    _id: authorizeId,
    token: hashedRefresh,
    expiry: refreshExpiry,
  });

  await existsUser.save();

  return new HttpResponse(200, "Signed in successfully!", { data: userInfo });
});

export const signOutUser = asyncHandler(async (req, res) => {
  const currentAuthKey = req.cookies["current"];

  if (currentAuthKey) {
    await revokeToken(res, currentAuthKey);
  }

  res.clearCookie("access", cookieOptions);
  res.clearCookie("refresh", cookieOptions);
  res.clearCookie("current", cookieOptions);

  return new HttpResponse(200, "Signed out successfully!");
});

export const authRefresh = asyncHandler(async (req, res) => {
  const deviceId = req.headers["x-device-id"] as string;
  const refreshToken = req.cookies["refresh"];
  const currentAuthKey = req.cookies["current"];

  if (!refreshToken || !currentAuthKey) {
    throw new HttpError(401, "Unauthorized request!");
  }

  const verifiedData = await (async () => {
    try {
      const parsedPayload = parseAuthKey(currentAuthKey);

      const [jwtResult, hashedToken] = await Promise.all([
        jwtVerify<{ uid: string }>(refreshToken, refreshSecret, {
          algorithms: ["HS512"],
        }),
        generateHash(refreshToken),
      ]);

      if (
        !Types.ObjectId.isValid(jwtResult.payload.uid) ||
        !parsedPayload.userId.equals(new Types.ObjectId(jwtResult.payload.uid)) ||
        jwtResult.payload.jti !== deviceId
      ) {
        throw new Error("Refresh request mismatch!");
      }

      return {
        userId: parsedPayload.userId,
        authorizeId: parsedPayload.authId,
        hashedRefresh: hashedToken,
        refreshExpiry: jwtResult.payload.exp,
      };
    } catch {
      await revokeToken(res, currentAuthKey);
      throw new HttpError(401, "Please, sign in again!");
    }
  })();

  const { userId, authorizeId, hashedRefresh, refreshExpiry } = verifiedData;
  const currentTime = Math.floor(Date.now() / 1000);
  const expiresAt = refreshExpiry ?? currentTime;

  const authFilter = {
    _id: userId,
    authentication: {
      $elemMatch: { _id: authorizeId, token: hashedRefresh, expiry: { $gt: new Date() } },
    },
  };

  const requestUser = await User.findOne(authFilter);

  if (!requestUser) {
    throw new HttpError(401, "Please, sign in again!");
  }

  const userInfo = createUserInfo(requestUser);
  const shouldRotate = currentTime >= expiresAt - env.REFRESH_EXPIRY / 2;

  if (shouldRotate) {
    const newRefreshToken = await generateRefresh(res, userId, authorizeId, deviceId);
    const newHashedRefresh = generateHash(newRefreshToken);
    const newRefreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);

    const updatedResult = await User.updateOne(authFilter, {
      $set: {
        "authentication.$.token": newHashedRefresh,
        "authentication.$.expiry": newRefreshExpiry,
      },
    });

    if (updatedResult.modifiedCount === 0) {
      await revokeToken(res, currentAuthKey);
      throw new HttpError(401, "Please, sign in again!");
    }
  }

  await generateAccess(res, userInfo);

  return new HttpResponse(200, "Refreshed successfully!", { data: userInfo });
});
