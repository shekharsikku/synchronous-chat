import { type ClassValue, clsx } from "clsx";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import femaleAvatar from "@/assets/female-avatar.webp";
import maleAvatar from "@/assets/male-avatar.webp";
import noAvatar from "@/assets/no-avatar.webp";
import { type Message } from "@/lib/zustand";

dayjs.extend(localizedFormat);

export const formatUtcTimestamp = (timestamp: any) => {
  return dayjs(timestamp).format("MMM DD, YYYY | h:mm A");
};

export const formatMsgTimestamp = (timestamp?: Date) => {
  const createdAt = dayjs(timestamp);

  const dateLabel = createdAt.isSame(dayjs(), "day")
    ? "Today"
    : createdAt.isSame(dayjs().subtract(1, "day"), "day")
      ? "Yesterday"
      : createdAt.format("LL");

  const messageDate = createdAt.format("YYYY-MM-DD");

  return { dateLabel, messageDate };
};

export const renderMsgTimestamp = (message: Message) => {
  if (message.type === "deleted") {
    return `Deleted at ${dayjs(message.deletedAt).format("LT")}`;
  }

  if (message.type === "edited") {
    return `Edited at ${dayjs(message.updatedAt).format("LT")}`;
  }

  return dayjs(message.createdAt).format("LT");
};

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

  const extractedExtension = filePath.split("?")[0].split("#")[0].split(".").pop();

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

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const mergeRefs =
  (...refs: any[]) =>
  (element: any) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(element);
      } else {
        ref.current = element;
      }
    });
  };

export const copyToClipboard = (text: string) => {
  try {
    void navigator.clipboard.writeText(text);
    toast.info("Message copied to clipboard!");
  } catch (_error) {
    toast.error("Failed to copy message!");
  }
};

export const handleDownload = (file: string, name: string) => {
  if (!file || !name) {
    toast.error("Please, give file link to download!");
    return;
  }
  const link = document.createElement("a");
  link.href = file;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatTimer = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    const formattedHours = hours.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    return `${formattedMinutes}:${formattedSeconds}`;
  }
};

export const getAvatar = (userInfo: any) => {
  if (userInfo?.image) return userInfo.image;

  if (userInfo?.gender === "Male") return maleAvatar;
  if (userInfo?.gender === "Female") return femaleAvatar;

  return noAvatar;
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
