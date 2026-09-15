import { hash, compare } from "bcryptjs";
import { User } from "#/models/index.js";
import { generateHash } from "#/utilities/crypto.js";
import { toUserInfo } from "#/utilities/helpers.js";
import { HttpError, HttpResponse, asyncHandler } from "#/utilities/response.js";
import type { SignUp, SignIn } from "#/utilities/schema.js";
import { cookieOptions, generateToken, verifyToken, revokeToken } from "#/utilities/tokens.js";

export const signUpUser = asyncHandler<{}, {}, SignUp>(async (req, res) => {
  const { email, password } = req.body;

  const existsEmail = await User.exists({ email });

  if (existsEmail) {
    throw new HttpError(409, "Email already exists!");
  }

  const hashed = await hash(password, 12);
  const newUser = await User.create({ email, password: hashed });
  const userInfo = toUserInfo(newUser);
  await generateToken(res, userInfo.id, "access");

  return HttpResponse.success(res, 201, "Signed up successfully!", userInfo);
});

export const signInUser = asyncHandler<{}, {}, SignIn>(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new HttpError(400, "Email or Username required!");
  }

  const existsUser = await User.findOne({
    $or: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])],
  }).select("+password +authentication");

  if (!existsUser || !(await compare(password, existsUser.password))) {
    throw new HttpError(401, "Invalid credentials!");
  }

  const userInfo = toUserInfo(existsUser);
  await generateToken(res, userInfo.id, "access");

  if (!userInfo.setup) {
    return HttpResponse.success(res, 200, "Complete your profile!", userInfo);
  }

  const jwtToken = await generateToken(res, userInfo.id, "refresh");

  existsUser.authentication?.push({
    token: jwtToken.hash,
    expiry: jwtToken.expiry,
  });

  await existsUser.save();

  return HttpResponse.success(res, 200, "Signed in successfully!", userInfo);
});

export const signOutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies["refresh"];

  if (refreshToken) {
    await revokeToken(res, refreshToken);
  }

  res.clearCookie("access", cookieOptions);
  res.clearCookie("refresh", cookieOptions);

  return HttpResponse.success(res, 200, "Signed out successfully!");
});

export const authRefresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies["refresh"];

  if (!refreshToken) {
    throw new HttpError(401, "Unauthorized request!");
  }

  const { authFilter, shouldRotate } = await (async () => {
    try {
      const { payload } = await verifyToken(refreshToken, "refresh");

      const halfTime = (payload.exp - payload.iat) / 2;
      const shouldRotate = Math.floor(Date.now() / 1000) >= payload.iat + halfTime;

      const authFilter = {
        _id: payload.uid,
        authentication: {
          $elemMatch: {
            token: generateHash(refreshToken),
            expiry: { $gt: new Date() },
          },
        },
      };

      return { authFilter, shouldRotate };
    } catch {
      await revokeToken(res, refreshToken);
      throw new HttpError(401, "Please, sign in again!");
    }
  })();

  const requestUser = await User.findOne(authFilter);

  if (!requestUser) {
    await revokeToken(res, refreshToken);
    throw new HttpError(401, "Please, sign in again!");
  }

  const userInfo = toUserInfo(requestUser);

  if (shouldRotate) {
    const jwtToken = await generateToken(res, userInfo.id, "refresh");

    const updatedResult = await User.updateOne(authFilter, {
      $set: {
        "authentication.$.token": jwtToken.hash,
        "authentication.$.expiry": jwtToken.expiry,
      },
    });

    if (updatedResult.modifiedCount === 0) {
      await revokeToken(res, refreshToken);
      throw new HttpError(401, "Please, sign in again!");
    }
  }

  await generateToken(res, userInfo.id, "access");

  return HttpResponse.success(res, 200, "Refreshed successfully!");
});

export const authRetrieve = asyncHandler(async (req, res) => {
  const accessToken = req.cookies["access"];
  return HttpResponse.success(res, 200, "Retrieved successfully!", accessToken);
});
