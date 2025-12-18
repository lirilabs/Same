import admin from "firebase-admin";
import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  // ---------- CORS ----------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

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
    const uid =
      req.method === "GET" ? req.query.uid : req.body?.uid;

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "Invalid or missing uid" });
    }

    // ---------- USER PROFILE ----------
    const user = await admin.auth().getUser(uid);

    // ---------- LOAD THOUGHTS DATASET (DIRECT) ----------
    const thoughtsRes = await readJSON("data/thoughts/2025-12-15.json");
    const allThoughts = Array.isArray(thoughtsRes.json)
      ? thoughtsRes.json
      : [];

    // ---------- FILTER USER THOUGHTS ----------
    const userThoughts = allThoughts.filter(t => t.uid === uid);

    // ---------- CALCULATE TOTAL LIKES ----------
    let totalLikes = 0;
    for (const t of userThoughts) {
      totalLikes += t.likes?.count || 0;
    }

    // ---------- RESPONSE ----------
    return res.status(200).json({
      user: {
        uid: user.uid,
        name: user.displayName || null,
        photo: user.photoURL || null,
        email: user.email || null,
        providers: user.providerData.map(p => p.providerId),
      },
      posts: {
        count: userThoughts.length,
        totalLikes,
        details: userThoughts   // ✅ FULL DATASET HERE
      }
    });

  } catch (err) {
    console.error("API error:", err.message);
    return res.status(500).json({
      error: "Failed to fetch profile thoughts",
      detail: err.message
    });
  }
}
