import type { Response } from "express";
import { genSalt, hash, compare } from "bcryptjs";
import { jwtVerify } from "jose";
import { Types } from "mongoose";
import { User } from "#/models/index.js";
import { logger } from "#/middlewares/index.js";
import env from "#/utilities/env.js";
import { cookieOptions, generateAccess, generateRefresh, createUserInfo, generateHash } from "#/utilities/helpers.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";
import type { SignUp, SignIn } from "#/utilities/schema.js";

const parseAuthKey = (authKey: any) => {
  const [firstKey, secondKey] = authKey.split(":", 2);

  if (!Types.ObjectId.isValid(firstKey) || !Types.ObjectId.isValid(secondKey)) {
    throw new Error("Invalid authentication key!");
  }

  return { userId: new Types.ObjectId(firstKey), authId: new Types.ObjectId(secondKey) };
};

const revokeToken = async (res: Response, authKey: any) => {
  try {
    const { userId, authId } = parseAuthKey(authKey);

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
  const hashedPassword = await hash(password, hashSalt);

  const newUser = await User.create({ email, password: hashedPassword });
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

  if (!existsUser) {
    throw new HttpError(404, "User not exists!");
  }

  const isCorrect = await compare(password, existsUser.password);

  if (!isCorrect) {
    throw new HttpError(403, "Incorrect password!");
  }

  const userInfo = createUserInfo(existsUser);
  await generateAccess(res, userInfo);

  if (!userInfo.setup) {
    return new HttpResponse(200, "Please, complete your profile!", { data: userInfo });
  }

  const authorizeId = new Types.ObjectId();
  const refreshToken = await generateRefresh(res, userInfo._id, authorizeId, deviceId);
  const hashedRefresh = await generateHash(refreshToken);
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
    throw new HttpError(401, "Unauthorized refresh request!");
  }

  const verifiedData = await (async () => {
    try {
      const parsedPayload = parseAuthKey(currentAuthKey);
      const refreshSecret = new TextEncoder().encode(env.REFRESH_SECRET);

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
      throw new HttpError(403, "Please, signin again to continue!");
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
    throw new HttpError(401, "Invalid authorization!");
  }

  const userInfo = createUserInfo(requestUser);
  const shouldRotate = currentTime >= expiresAt - env.REFRESH_EXPIRY / 2;

  if (shouldRotate) {
    const newRefreshToken = await generateRefresh(res, userId, authorizeId, deviceId);
    const newHashedRefresh = await generateHash(newRefreshToken);
    const newRefreshExpiry = new Date(Date.now() + env.REFRESH_EXPIRY * 1000);

    const updatedResult = await User.updateOne(authFilter, {
      $set: {
        "authentication.$.token": newHashedRefresh,
        "authentication.$.expiry": newRefreshExpiry,
      },
    });

    if (updatedResult.modifiedCount === 0) {
      await revokeToken(res, currentAuthKey);
      throw new HttpError(403, "Please, signin again to continue!");
    }
  }

  await generateAccess(res, userInfo);

  return new HttpResponse(200, "Token refreshed successfully!");
});
