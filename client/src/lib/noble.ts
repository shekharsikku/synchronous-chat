import { gcm } from "@noble/ciphers/aes.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { utf8ToBytes, randomBytes } from "@noble/hashes/utils.js";

const isDevelopment = import.meta.env.DEV;

/**
 * Simple encryption using a key derived from a user ID
 * This implementation uses only @noble/hashes for simplicity
 *
 * @param text - Plain text to encrypt
 * @param uid - User ID used as encryption key base
 * @returns Base64-encoded encrypted string
 */
export const encryptMessage = (text: string, uid: string): string => {
  try {
    /** Generate a consistent encryption key from the UID using SHA-256 */
    const keyBytes = sha256(utf8ToBytes(uid));

    /** Convert the text to UTF-8 bytes */
    const textBytes = utf8ToBytes(text);

    /** Simple XOR encryption with the key bytes */
    const encrypted = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    /** Convert to base64 for safe storage/transmission */
    return btoa(String.fromCharCode(...encrypted));
  } catch (error: any) {
    isDevelopment && console.error("Encryption error:", error.message);
    throw new Error("Encryption failed!");
  }
};

/**
 * Decrypt a message encrypted with encryptMessage
 *
 * @param text - Base64-encoded encrypted string
 * @param uid - User ID used as decryption key base
 * @returns Decrypted plain text
 */
export const decryptMessage = (text: string, uid: string): string => {
  try {
    /** Generate the same encryption key from the UID */
    const keyBytes = sha256(utf8ToBytes(uid));

    /** Convert base64 back to bytes */
    const encryptedBytes = new Uint8Array(
      atob(text)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    /** XOR decryption (same operation as encryption) */
    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    /** Convert bytes back to text */
    return new TextDecoder().decode(decrypted);
  } catch (error: any) {
    isDevelopment && console.error("Decryption error:", error.message);
    throw new Error("Decryption failed!");
  }
};

/**
 *  Encrypts a message using AES-GCM with a key derived from the UID.
 */
export const encryptInfo = (info: string, secret: string): string => {
  const key = sha256(utf8ToBytes(secret));
  const iv = randomBytes(12);

  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(utf8ToBytes(info));

  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv);
  combined.set(ciphertext, iv.length);

  return btoa(String.fromCharCode(...combined));
};

/**
 *  Decrypts a message previously encrypted with encryptInfo.
 */
export const decryptInfo = (info: string, secret: string): string => {
  const key = sha256(utf8ToBytes(secret));
  const combined = Uint8Array.from(atob(info), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const cipher = gcm(key, iv);
  const plaintext = cipher.decrypt(ciphertext);

  return new TextDecoder().decode(plaintext);
};
