import { readJSON } from "../_lib/github.js";
import { decrypt } from "../_lib/encrypt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // 1️⃣ Load ID map
    const mapRes = await readJSON("data/indexes/id-map.json");
    const idMap = mapRes.json || {};

    const items = [];

    // 2️⃣ Loop through all thoughts
    for (const id of Object.keys(idMap)) {
      const meta = idMap[id];
      if (!meta) continue;

      const fileRes = await readJSON(meta.path);
      const list = Array.isArray(fileRes.json) ? fileRes.json : [];
      const item = list[meta.index];
      if (!item) continue;

      items.push({
        id: item.id,
        text: decrypt(item.raw_encrypted),
        semantic: item.semantic,
        ts: item.ts,
        uid: item.uid
      });
    }

    // 3️⃣ Sort newest first
    items.sort((a, b) => b.ts - a.ts);

    return res.json({
      count: items.length,
      items
    });

  } catch (err) {
    console.error("FEED ALL ERROR:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
