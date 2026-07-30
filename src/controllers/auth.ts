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

export const parseToken = (token: string) => {
  const { uid, aid } = decryptAuth(token);

  if (!Types.ObjectId.isValid(uid) || !Types.ObjectId.isValid(aid)) {
    throw new Error("Invalid authentication token!");
  }

  return { userId: new Types.ObjectId(uid), authId: new Types.ObjectId(aid) };
};

export const revokeToken = async (res: Response, token: string) => {
  try {
    const { userId, authId } = parseToken(token);

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

  return HttpResponse.success(res, 201, "Signed up successfully!", userInfo);
});

export const signInUser = asyncHandler<{}, {}, SignIn>(async (req, res) => {
  const { email, username, password } = req.body;
  const query = email ? { email } : username ? { username } : null;

  if (!query) {
    throw new HttpError(400, "Email or Username required!");
  }

  const existsUser = await User.findOne(query).select("+password +authentication");

  if (!existsUser || !(await compare(password, existsUser.password))) {
    throw new HttpError(401, "Invalid credentials!");
  }

  const userInfo = createUserInfo(existsUser);
  await generateAccess(res, userInfo);

  if (!userInfo.setup) {
    return HttpResponse.success(res, 200, "Complete your profile!", userInfo);
  }

  const authId = new Types.ObjectId();
  const refreshToken = await generateRefresh(res, userInfo._id.toString(), authId.toString());

  existsUser.authentication?.push({
    _id: authId,
    token: generateHash(refreshToken),
    expiry: new Date(Date.now() + env.REFRESH_EXPIRY * 1000),
  });

  await existsUser.save();

  return HttpResponse.success(res, 200, "Signed in successfully!", userInfo);
});

export const signOutUser = asyncHandler(async (req, res) => {
  const currentToken = req.cookies["current"];

  if (currentToken) await revokeToken(res, currentToken);

  res.clearCookie("access", cookieOptions);
  res.clearCookie("refresh", cookieOptions);
  res.clearCookie("current", cookieOptions);

  return HttpResponse.success(res, 200, "Signed out successfully!");
});

export const authRefresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies["refresh"];
  const currentToken = req.cookies["current"];

  if (!refreshToken || !currentToken) {
    throw new HttpError(401, "Unauthorized request!");
  }

  const { userId, authId, shouldRotate } = await (async () => {
    try {
      const { userId, authId } = parseToken(currentToken);

      const jwtResult = await jwtVerify(refreshToken, refreshSecret, {
        algorithms: ["HS512"],
      });

      if (!userId.equals(jwtResult.payload.sub) || !authId.equals(jwtResult.payload.jti)) {
        throw new Error("Refresh request mismatch!");
      }

      const issuedAt = jwtResult.payload.iat!;
      const expiresAt = jwtResult.payload.exp!;
      const currentTs = Math.floor(Date.now() / 1000);

      const shouldRotate = currentTs >= issuedAt + (expiresAt - issuedAt) / 2;

      return { userId, authId, shouldRotate };
    } catch {
      await revokeToken(res, currentToken);
      throw new HttpError(401, "Please, sign in again!");
    }
  })();

  const authFilter = {
    _id: userId,
    authentication: {
      $elemMatch: { _id: authId, token: generateHash(refreshToken), expiry: { $gt: new Date() } },
    },
  };

  const requestUser = await User.findOne(authFilter);

  if (!requestUser) {
    throw new HttpError(401, "Please, sign in again!");
  }

  const userInfo = createUserInfo(requestUser);

  if (shouldRotate) {
    const refreshedToken = await generateRefresh(res, userId.toString(), authId.toString());

    const updatedResult = await User.updateOne(authFilter, {
      $set: {
        "authentication.$.token": generateHash(refreshedToken),
        "authentication.$.expiry": new Date(Date.now() + env.REFRESH_EXPIRY * 1000),
      },
    });

    if (updatedResult.modifiedCount === 0) {
      await revokeToken(res, currentToken);
      throw new HttpError(401, "Please, sign in again!");
    }
  }

  await generateAccess(res, userInfo);

  return HttpResponse.success(res, 200, "Refreshed successfully!", userInfo);
});
