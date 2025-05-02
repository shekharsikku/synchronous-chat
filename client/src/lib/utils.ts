import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertToBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = () => {
      resolve(fileReader.result);
    };

    fileReader.onerror = (error) => {
      reject(error);
    };
  });
};

export const checkImageType = (filePath: string): boolean => {
  const validExtensions = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "tiff",
    "tif",
    "webp",
    "svg",
    "ico",
    "heic",
    "heif",
  ]);

  if (filePath.startsWith("data:image/")) {
    const base64Type = filePath.split(";")[0].split("/")[1];
    return validExtensions.has(base64Type.toLowerCase());
  }

  const extractedExtension = filePath
    .split("?")[0]
    .split("#")[0]
    .split(".")
    .pop();

  if (!extractedExtension) return false;
  return validExtensions.has(extractedExtension.toLowerCase());
};

export const validateUsername = (username: string) => {
  const re = /^(?![_-])[a-z0-9_-]{3,15}(?<![_-])$/;
  return re.test(username);
};

export const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email);
};

export const removeSpaces = (str: string) => {
  return str.replace(/\s+/g, "");
};

export const capitalizeWord = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string) => {
  return str
    .split(" ")
    .map((word) => capitalizeWord(word))
    .join(" ");
};

export const validateDummyEmail = (email: string): boolean => {
  const restrictedWords = [
    "example",
    "demo",
    "temp",
    "sample",
    "fake",
    "new",
    "you",
    "abc",
    "xyz",
    "placeholder",
    "kuch",
    "user",
    "email",
    "reply",
    "noreply",
    "dummy",
    "admin",
    "webmaster",
    "support",
    "junk",
    "spam",
    "valid",
    "invalid",
    "known",
    "unknown",
    "null",
    "not",
    "ing",
    "env",
    "dev",
    "pro",
    "prod",
    "test",
    "staging",
    "noob",
  ];
  const emailLower = email.toLowerCase();
  return restrictedWords.some((word) => emailLower.includes(word));
};

export const languageOptions = [
  {
    name: "English",
    code: "en",
  },
  {
    name: "Hindi",
    code: "hi",
  },
  {
    name: "Punjabi",
    code: "pa",
  },
  {
    name: "Bengali",
    code: "bn",
  },
  {
    name: "Gujarati",
    code: "gu",
  },
  {
    name: "Marathi",
    code: "mr",
  },
  {
    name: "Arabic",
    code: "ar",
  },
  {
    name: "Kannada",
    code: "kn",
  },
  {
    name: "Malayalam",
    code: "ml",
  },
  {
    name: "Tamil",
    code: "ta",
  },
  {
    name: "Telugu",
    code: "te",
  },
];

export const countMessages = (messages: any, selectedChat: any) => {
  let sent = 0;
  let received = 0;

  messages.forEach((message: any) => {
    if (message.sender === selectedChat._id) {
      received += 1;
    } else if (message.recipient === selectedChat._id) {
      sent += 1;
    }
  });

  return { sent, received };
};

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/*

import CryptoJS from "crypto-js";

export const encryptMessage = (text: string, uid: string) => {
  const secret = CryptoJS.SHA256(uid).toString(CryptoJS.enc.Base64);
  return CryptoJS.AES.encrypt(text, secret).toString();
};

export const decryptMessage = (text: string, uid: string) => {
  const secret = CryptoJS.SHA256(uid).toString(CryptoJS.enc.Base64);
  return CryptoJS.AES.decrypt(text, secret).toString(CryptoJS.enc.Utf8);
};

*/
