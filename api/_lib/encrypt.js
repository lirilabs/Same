import crypto from "crypto";

const ALGO = "aes-256-gcm";

// IMPORTANT: hex → bytes
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

if (KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
}

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}.${tag}.${encrypted}`;
}
