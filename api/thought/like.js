import { readJSON, writeJSON } from "../../_lib/github.js";

/* ======================================================
   CORS
====================================================== */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/* ======================================================
   API HANDLER
====================================================== */
export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { thoughtId, uid } = req.body || {};

    if (!thoughtId || !uid) {
      return res.status(400).json({
        error: "Missing thoughtId or uid"
      });
    }

    /* ===============================
       1️⃣ READ THOUGHT INDEX
    =============================== */
    const indexPath = "data/indexes/thought-index.json";
    const indexRes = await readJSON(indexPath);
    const index = indexRes.json || {};

    const fileName = index[thoughtId];
    if (!fileName) {
      return res.status(404).json({
        error: "Thought not indexed"
      });
    }

    /* ===============================
       2️⃣ READ THOUGHT FILE
    =============================== */
    const thoughtPath = `data/thoughts/${fileName}`;
    const result = await readJSON(thoughtPath);
    const list = Array.isArray(result.json) ? result.json : [];

    const idx = list.findIndex(t => t.id === thoughtId);
    if (idx === -1) {
      return res.status(404).json({
        error: "Thought not found"
      });
    }

    const thought = list[idx];

    /* ===============================
       3️⃣ INIT LIKES (BACKWARD SAFE)
    =============================== */
    if (!thought.likes || typeof thought.likes !== "object") {
      thought.likes = { count: 0, users: {} };
    }
    if (!thought.likes.users) {
      thought.likes.users = {};
    }

    /* ===============================
       4️⃣ TOGGLE LIKE
    =============================== */
    let liked;

    if (thought.likes.users[uid]) {
      delete thought.likes.users[uid];
      thought.likes.count = Math.max(0, thought.likes.count - 1);
      liked = false;
    } else {
      thought.likes.users[uid] = true;
      thought.likes.count++;
      liked = true;
    }

    list[idx] = thought;

    /* ===============================
       5️⃣ SAVE BACK
    =============================== */
    await writeJSON(thoughtPath, list, result.sha);

    return res.json({
      status: "ok",
      liked,
      count: thought.likes.count,
      file: fileName
    });

  } catch (err) {
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
