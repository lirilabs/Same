import crypto from "crypto";

// --- Configuration ---
// AES-256-GCM is an authenticated encryption mode.
const ALGO = "aes-256-gcm"; 
// The KEY MUST be exactly 32 bytes (256 bits) for this algorithm.
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "utf8");

/**
 * Encrypts a string using AES-256-GCM.
 * The output is a base64-encoded string combining the IV, Auth Tag, and Ciphertext.
 * Format: IV.AuthTag.Ciphertext
 * * @param {string} text The plaintext string to encrypt.
 * @returns {string} The combined encrypted string.
 */
export function encrypt(text) {
  // 1. Generate a unique 12-byte (96-bit) Initialization Vector (IV).
  const iv = crypto.randomBytes(12);
  
  // 2. Create the cipher object.
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  // 3. Encrypt the data.
  // 'utf8' input encoding, 'base64' output encoding.
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64"); // Finalize encryption.

  // 4. Get the Authentication Tag (for integrity/authenticity).
  const tag = cipher.getAuthTag().toString("base64");

  // 5. **CORRECTION:** Use a template literal (backticks) for the return string.
  return `${iv.toString("base64")}.${tag}.${encrypted}`;
}
