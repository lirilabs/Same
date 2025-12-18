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

    // ---------- USER POST IDS ----------
    const userIndexRes = await readJSON("data/indexes/user-index.json");
    const userIndex = userIndexRes.json || {};
    const postIds = Array.isArray(userIndex[uid]) ? userIndex[uid] : [];

    // ---------- LOAD THOUGHT INDEX ----------
    const thoughtIndexRes = await readJSON("data/indexes/thought-index.json");
    const thoughtIndex = thoughtIndexRes.json || {};

    let totalLikes = 0;
    const postDetails = [];

    // ---------- LOOP THROUGH POSTS ----------
    for (const postId of postIds) {
      const fileName = thoughtIndex[postId];
      if (!fileName) continue;

      const dayRes = await readJSON(`data/thoughts/${fileName}`);
      const list = Array.isArray(dayRes.json) ? dayRes.json : [];

      const post = list.find(p => p.id === postId);
      if (!post) continue;

      const likeCount = post.likes?.count || 0;
      totalLikes += likeCount;

      postDetails.push({
        id: post.id,
        ts: post.ts,
        likes: likeCount,
        hasMusic: !!post.music,
        emotion: post.semantic?.emotion || null,
        intent: post.semantic?.intent || null,
        domain: post.semantic?.domain || null,
      });
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
        count: postIds.length,
        totalLikes,
        details: postDetails
      }
    });

  } catch (err) {
    console.error("API error:", err.message);
    return res.status(500).json({
      error: "Failed to fetch user analytics",
      detail: err.message
    });
  }
}
