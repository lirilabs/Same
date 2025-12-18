import admin from "firebase-admin";

export default async function handler(req, res) {
  // ---------- CORS ----------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
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

    // ---------- INPUT ----------
    const { uid } = req.body || {};

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "Invalid or missing uid" });
    }

    // ---------- FETCH USER ----------
    const user = await admin.auth().getUser(uid);

    // ---------- RESPONSE ----------
    return res.status(200).json({
      uid: user.uid,
      name: user.displayName || null,
      photo: user.photoURL || null,
      email: user.email || null,
      providers: user.providerData.map(p => p.providerId),
    });

  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch user",
      detail: err.message,
    });
  }
}
