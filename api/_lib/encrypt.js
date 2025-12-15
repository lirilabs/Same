import crypto from "crypto";

const ALGO = "aes-256-gcm";

// hex → bytes (64 hex chars = 32 bytes)
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

if (KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
}

// ---------------- ENCRYPT ----------------
export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");

  // iv.tag.encrypted
  return `${iv.toString("base64")}.${tag}.${encrypted}`;
}

// ---------------- DECRYPT ----------------
export function decrypt(payload) {
  if (!payload || typeof payload !== "string") return null;

  const parts = payload.split(".");
  if (parts.length !== 3) return null;

  const [ivB64, tagB64, encrypted] = parts;

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);

  let text = decipher.update(encrypted, "base64", "utf8");
  text += decipher.final("utf8");

  return text;
}
