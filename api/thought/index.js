import { encrypt } from "../_lib/encrypt.js";
import { classifyThought } from "../_lib/classify.js";
import { readJSON, writeJSON } from "../_lib/github.js";
import { updateIndex } from "../_lib/indexer.js";
import { updateUserIndex } from "../_lib/userIndexer.js";

/* ======================================================
   CORS – ALLOW ALL (BROWSER SAFE)
====================================================== */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/* ======================================================
   DEFAULT STYLE
====================================================== */
function defaultStyle() {
  return {
    color: "#94A3B8",
    ratio: "4:5",
    font: "Inter",
    weight: 500,
    theme: "light"
  };
}

/* ======================================================
   API HANDLER
====================================================== */
export default async function handler(req, res) {
  setCors(res);

  // ---- Preflight (THIS IS CRITICAL) ----
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    // ---- Parse body safely ----
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const { uid, text, style } = body;

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "Invalid uid" });
    }

    if (!text || typeof text !== "string" || text.length > 200) {
      return res.status(400).json({ error: "Invalid text" });
    }

    // ---- Core logic ----
    const semantic = await classifyThought(text);
    const encrypted = encrypt(text);

    const finalStyle = {
      ...defaultStyle(),
      ...(style || {})
    };

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
      semantic,
      style: finalStyle
    });

    await writeJSON(path, list, result.sha);

    const key = `${semantic.emotion}|${semantic.domain}|${semantic.intent}`;
    await updateIndex(key, id);
    await updateUserIndex(uid, id);

    return res.status(200).json({
      status: "ok",
      id,
      style: finalStyle
    });

  } catch (err) {
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
