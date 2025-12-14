import crypto from "crypto";

const ALGO = "aes-256-gcm";

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY missing");
}

const KEY = Buffer.from(
  process.env.ENCRYPTION_KEY.trim(),
  "hex"
);

// 🔥 HARD FAIL if wrong
if (KEY.length !== 32) {
  throw new Error(`Invalid key length: ${KEY.length}`);
}

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}.${tag}.${encrypted}`;
}
