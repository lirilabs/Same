import { encrypt } from "../_lib/encrypt.js";
import { classifyThought } from "../_lib/classify.js";
import { readJSON, writeJSON } from "../_lib/github.js";
import { updateIndex } from "../_lib/indexer.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { text, uid } = req.body || {};

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "Invalid uid" });
    }

    if (!text || typeof text !== "string" || text.length > 200) {
      return res.status(400).json({ error: "Invalid text" });
    }

    // ---------- AI (FAIL SAFE) ----------
    let semantic = null;
    try {
      semantic = await classifyThought(text);
    } catch (aiErr) {
      console.warn("AI classify failed, continuing:", aiErr.message);
      semantic = {
        emotion: "unknown",
        domain: "unknown",
        intent: "reflection"
      };
    }

    // ---------- ENCRYPT ----------
    const encrypted = encrypt(text);

    // ---------- STORE ----------
    const id = `t_${Date.now().toString(36)}`;
    const today = new Date().toISOString().slice(0, 10);
    const path = `data/thoughts/${today}.json`;

    const result = await readJSON(path);
    const list = Array.isArray(result.json) ? result.json : [];

    list.push({
      id,
      uid,
      ts: Date.now(),
      raw_encrypted: encrypted,
      semantic
    });

    await writeJSON(path, list, result.sha);

    // ---------- INDEX (OPTIONAL) ----------
    if (semantic?.emotion && semantic?.domain && semantic?.intent) {
      const key = `${semantic.emotion}|${semantic.domain}|${semantic.intent}`;
      await updateIndex(key, id);
    }

    return res.json({
      status: "ok",
      id,
      semantic
    });

  } catch (err) {
    console.error("POST /api/thought ERROR:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
