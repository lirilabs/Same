import admin from "firebase-admin";
import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- INIT FIREBASE ----------
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FB_PROJECT_ID,
          clientEmail: process.env.FB_CLIENT_EMAIL,
          privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    // ---------- UID ----------
    const uid = req.method === "GET" ? req.query.uid : req.body?.uid;
    if (!uid) return res.status(400).json({ error: "Missing uid" });

    // ---------- USER PROFILE ----------
    const user = await admin.auth().getUser(uid);

    // ---------- LOAD DATASET ----------
    const dataRes = await readJSON("data/thoughts/2025-12-15.json");
    const thoughts = Array.isArray(dataRes.json) ? dataRes.json : [];

    const userThoughts = thoughts.filter(t => t.uid === uid);

    // ---------- COLLECTIVE STATS ----------
    let totalLikes = 0;
    let postsWithMusic = 0;
    const emotionStats = {};
    const postSummaries = [];
    const likedUsersMap = {};

    for (const t of userThoughts) {
      const likeCount = t.likes?.count || 0;
      totalLikes += likeCount;

      if (t.music) postsWithMusic++;

      const emotion = t.semantic?.emotion || "unknown";
      emotionStats[emotion] = (emotionStats[emotion] || 0) + 1;

      postSummaries.push({
        id: t.id,
        ts: t.ts,
        emotion,
        intent: t.semantic?.intent || null,
        likes: likeCount
      });

      // ---------- COLLECT LIKED USERS ----------
      if (t.likes?.users) {
        for (const likerUid of Object.keys(t.likes.users)) {
          if (!likedUsersMap[likerUid]) {
            likedUsersMap[likerUid] = {
              uid: likerUid,
              likedPosts: []
            };
          }
          likedUsersMap[likerUid].likedPosts.push(t.id);
        }
      }
    }

    // ---------- FETCH LIKED USERS PROFILE ----------
    const likedUsers = [];
    for (const likerUid of Object.keys(likedUsersMap)) {
      try {
        const u = await admin.auth().getUser(likerUid);
        likedUsers.push({
          uid: u.uid,
          name: u.displayName || null,
          photo: u.photoURL || null,
          likedPosts: likedUsersMap[likerUid].likedPosts
        });
      } catch {
        // skip deleted users
      }
    }

    // ---------- RESPONSE ----------
    return res.json({
      user: {
        uid: user.uid,
        name: user.displayName || null,
        photo: user.photoURL || null,
        email: user.email || null
      },
      summary: {
        totalPosts: userThoughts.length,
        totalLikes,
        postsWithMusic,
        emotionStats
      },
      posts: postSummaries,
      likedUsers
    });

  } catch (err) {
    return res.status(500).json({
      error: "Profile aggregation failed",
      detail: err.message
    });
  }
}
