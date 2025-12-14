import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "utf8");

export function decrypt(payload) {
  const [ivB64, tagB64, encrypted] = payload.split(".");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);

  let text = decipher.update(encrypted, "base64", "utf8");
  text += decipher.final("utf8");

  return text;
}

