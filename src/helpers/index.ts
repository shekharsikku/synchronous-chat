import { genSalt, hash, compare } from "bcryptjs";
import { UserInterface } from "../interface";
import { Response } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import env from "../utils/env";

const generateHash = async (plain: string): Promise<string> => {
  const salt = await genSalt(12);
  const hashed = await hash(plain, salt);
  return hashed;
};

const compareHash = async (plain: string, hashed: string): Promise<boolean> => {
  const checked = await compare(plain, hashed);
  return checked;
};

const generateAccess = (res: Response, user?: UserInterface) => {
  const accessExpiry = env.ACCESS_EXPIRY;

  const accessToken = jwt.sign({ user }, env.ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: accessExpiry,
  });

  res.cookie("access", accessToken, {
    maxAge: accessExpiry * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });

  return accessToken;
};

const generateRefresh = (res: Response, uid: Types.ObjectId) => {
  const refreshExpiry = env.REFRESH_EXPIRY;

  const refreshToken = jwt.sign({ uid }, env.REFRESH_SECRET, {
    algorithm: "HS512",
    expiresIn: refreshExpiry,
  });

  res.cookie("refresh", refreshToken, {
    maxAge: refreshExpiry * 1000 * 2,
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProd,
  });

  return refreshToken;
};

const authorizeCookie = (res: Response, authorizeId: string) => {
  const authExpiry = env.REFRESH_EXPIRY;

  if (authorizeId) {
    res.cookie("auth_id", authorizeId, {
      maxAge: authExpiry * 1000 * 2,
      httpOnly: true,
      sameSite: "strict",
      secure: env.isProd,
    });
  }
};

const hasEmptyField = (fields: object) => {
  return Object.values(fields).some(
    (value) => value === "" || value === undefined || value === null
  );
};

const removeSpaces = (str: string) => {
  return str.replace(/\s+/g, "");
};

const capitalizeWord = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str: string) => {
  return str
    .split(" ")
    .map((word) => capitalizeWord(word))
    .join(" ");
};

const maskedObjectId = (objectId: Types.ObjectId) => {
  const idStr = objectId.toString();
  const maskedId = idStr.slice(0, 4) + "****" + idStr.slice(-4);
  return maskedId;
};

const maskedEmail = (email: string) => {
  const [localPart, domain] = email.split("@");
  const maskedLocalPart = localPart.slice(0, 4) + "***";
  return `${maskedLocalPart}@${domain}`;
};

const maskedDetails = (details: UserInterface) => {
  const maskId = maskedObjectId(details._id!);
  const maskEmail = maskedEmail(details.email);
  return {
    _id: maskId,
    email: maskEmail,
    setup: details.setup!,
  };
};

const createAccessData = (user: UserInterface) => {
  const accessData = {
    ...user.toObject(),
    password: undefined,
    authentication: undefined,
  };
  return accessData as UserInterface;
};

export {
  generateHash,
  compareHash,
  generateAccess,
  generateRefresh,
  authorizeCookie,
  hasEmptyField,
  removeSpaces,
  maskedDetails,
  createAccessData,
};
