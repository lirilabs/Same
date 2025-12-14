import crypto from "crypto";

const ALGO = "aes-256-gcm";

// MUST be 64 hex chars (32 bytes)
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

export function encrypt(text) {
  const iv = crypto.randomBytes(12); // 96-bit IV (correct for GCM)
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}.${tag}.${encrypted}`;
}
