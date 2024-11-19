import { z } from "zod";
import CryptoJS from "crypto-js";
import icon from "@/assets/favicon.ico";

export const signUpSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address!" }),
    password: z.string().min(6, { message: "Password is too short!" }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Confirm password not matching!",
  });

export const signInSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address!" }).optional(),
    username: z.string().optional(),
    password: z.string().min(1, { message: "Password is required!" }),
    device_information: z.string().optional(),
  })
  .refine((data) => data.email || data.username, {
    message: "Email or Username required!",
    path: ["email", "username"],
  });

export const changePasswordSchema = z
  .object({
    old_password: z.string(),
    new_password: z.string().min(6, { message: "New password is too short!" }),
    confirm_password: z
      .string()
      .min(6, { message: "Confirm password too short!" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Confirm password not matching!",
    path: ["new_password", "confirm_password"],
  });

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

export const colors = [
  "bg-[#712c4a57] text-[#ff006e] border-[1px] border-[#ff006faa]",
  "bg-[#ffd60a3a] text-[#ffd60a] border-[1px] border-[#ffd60abb]",
  "bg-[#06d6a02a] text-[#06d6a0] border-[1px] border-[#06d6a0bb]",
  "bg-[#4cc9f02a] text-[#4cc9f0] border-[1px] border-[#4cc9f0bb]",
];

export const getColor = (color: number) => {
  if (color >= 0 && color < colors.length) {
    return colors[color];
  }
  return colors[0];
};

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

export const countUserMessages = (messages: any, selectedChat: any) => {
  let sentCount = 0;
  let receivedCount = 0;

  messages.forEach((message: any) => {
    if (message.sender === selectedChat._id) {
      receivedCount += 1;
    } else if (message.recipient === selectedChat._id) {
      sentCount += 1;
    }
  });

  return {
    sent: sentCount,
    received: receivedCount,
  };
};

export const handleNotification = (title: string, body: string) => {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const notification = new Notification(title, {
          body,
          icon,
        });
        return notification;
      }
    });
  }
};

export const encryptMessage = (messageText: string, userId: string) => {
  const secretKey = CryptoJS.SHA256(userId).toString(CryptoJS.enc.Base64);
  const encrypted = CryptoJS.AES.encrypt(messageText, secretKey).toString();
  return encrypted;
};

export const decryptMessage = (messageText: string, userId: string) => {
  const secretKey = CryptoJS.SHA256(userId).toString(CryptoJS.enc.Base64);
  const decrypted = CryptoJS.AES.decrypt(messageText, secretKey).toString(
    CryptoJS.enc.Utf8
  );
  return decrypted;
};
