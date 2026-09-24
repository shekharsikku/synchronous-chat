import type { CookieOptions, Response } from "express";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import env from "#/configs/env.js";
import { User } from "#/models/index.js";
import { createSecret, generateHash } from "#/utilities/crypto.js";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "strict",
} as const;

const tokenOptions = {
  access: {
    algo: "HS256",
    expiry: env.ACCESS_EXPIRY,
    secret: createSecret(env.ACCESS_SECRET),
  },
  refresh: {
    algo: "HS512",
    expiry: env.REFRESH_EXPIRY,
    secret: createSecret(env.REFRESH_SECRET),
  },
} as const;

export const generateToken = async (res: Response, uid: string, type: "access" | "refresh") => {
  const { algo, expiry, secret } = tokenOptions[type];

  const token = await new SignJWT({ uid })
    .setProtectedHeader({ alg: algo })
    .setIssuedAt()
    .setExpirationTime(`${expiry}sec`)
    .sign(secret);

  res.cookie(type, token, {
    maxAge: expiry * 1000,
    ...cookieOptions,
  });

  return {
    hash: generateHash(token),
    expiry: new Date(Date.now() + expiry * 1000),
  };
};

type TokenPayload = { uid: string; iat: number; exp: number };

export const verifyToken = async (token: string, type: "access" | "refresh") => {
  const { algo, secret } = tokenOptions[type];

  return jwtVerify<TokenPayload>(token, secret, {
    algorithms: [algo],
  });
};

export const revokeToken = async (res: Response, token: string) => {
  try {
    const { uid } = decodeJwt<TokenPayload>(token);
    const tokenHash = generateHash(token);

    await User.updateOne(
      { _id: uid, authentication: { $elemMatch: { token: tokenHash } } },
      { $pull: { authentication: { token: tokenHash } } }
    );
  } finally {
    res.clearCookie("access", cookieOptions);
    res.clearCookie("refresh", cookieOptions);
  }
};
