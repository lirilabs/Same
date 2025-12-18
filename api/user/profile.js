import admin from "firebase-admin";
import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  // ---------- CORS ----------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // ---------- INIT FIREBASE ADMIN ----------
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FB_PROJECT_ID,
          clientEmail: process.env.FB_CLIENT_EMAIL,
          privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    // ---------- GET UID ----------
    let uid = null;

    if (req.method === "GET") {
      uid = req.query.uid;
    }

    if (req.method === "POST") {
      uid = req.body?.uid;
    }

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "Invalid or missing uid" });
    }

    // ---------- FETCH USER PROFILE ----------
    const user = await admin.auth().getUser(uid);

    // ---------- FETCH USER POSTS ----------
    const indexPath = "data/indexes/user-index.json";
    const indexResult = await readJSON(indexPath);

    const userIndex = indexResult.json || {};
    const posts = Array.isArray(userIndex[uid]) ? userIndex[uid] : [];

    // ---------- RESPONSE ----------
    return res.status(200).json({
      uid: user.uid,
      name: user.displayName || null,
      photo: user.photoURL || null,
      email: user.email || null,
      providers: user.providerData.map(p => p.providerId),

      posts: {
        count: posts.length,
        ids: posts
      }
    });

  } catch (err) {
    console.error("API error:", err.message);

    return res.status(500).json({
      error: "Failed to fetch user data",
      detail: err.message
    });
  }
}
