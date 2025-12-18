import admin from "firebase-admin";

export default async function handler(req, res) {
  console.log("➡️ API HIT:", req.method);

  // ---------- CORS ----------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log("✔ OPTIONS request");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log("❌ Invalid method");
    return res.status(405).json({ error: "POST only" });
  }

  try {
    // ---------- INIT FIREBASE ADMIN ----------
    if (!admin.apps.length) {
      console.log("🔧 Initializing Firebase Admin");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FB_PROJECT_ID,
          clientEmail: process.env.FB_CLIENT_EMAIL,
          privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      console.log("♻ Firebase Admin already initialized");
    }

    // ---------- INPUT ----------
    console.log("📥 Request body:", req.body);

    const { uid } = req.body || {};

    if (!uid || typeof uid !== "string") {
      console.log("❌ Invalid UID");
      return res.status(400).json({ error: "Invalid or missing uid" });
    }

    // ---------- FETCH USER ----------
    console.log("🔍 Fetching user:", uid);

    const user = await admin.auth().getUser(uid);

    console.log("✅ User fetched:", user.uid);

    // ---------- RESPONSE ----------
    return res.status(200).json({
      uid: user.uid,
      name: user.displayName || null,
      photo: user.photoURL || null,
      email: user.email || null,
      providers: user.providerData.map(p => p.providerId),
    });

  } catch (err) {
    console.error("🔥 API ERROR:", err.message);

    return res.status(500).json({
      error: "Failed to fetch user",
      detail: err.message,
    });
  }
}
