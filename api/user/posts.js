import { readJSON } from "../_lib/github.js";

/* ======================================================
   CORS
====================================================== */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/* ======================================================
   API HANDLER
====================================================== */
export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---------- GET UID ----------
    let uid = null;

    if (req.method === "GET") {
      uid = req.query.uid;
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body || {};

      uid = body.uid;
    }

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "Invalid or missing uid" });
    }

    // ---------- READ USER INDEX ----------
    const path = "data/indexes/user-index.json";
    const result = await readJSON(path);

    const index = result.json || {};
    const posts = Array.isArray(index[uid]) ? index[uid] : [];

    // ---------- RESPONSE ----------
    return res.status(200).json({
      uid,
      count: posts.length,
      posts
    });

  } catch (err) {
    return res.status(500).json({
      error: "Failed to read user index",
      detail: err.message
    });
  }
}
