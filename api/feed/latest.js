import { readJSON } from "../_lib/github.js";
import { decrypt } from "../_lib/encrypt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Optional pagination
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);

    // 1️⃣ Load ID map
    const mapRes = await readJSON("data/indexes/id-map.json");
    const idMap = mapRes.json && typeof mapRes.json === "object"
      ? mapRes.json
      : {};

    const items = [];

    // 2️⃣ Resolve each post
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

    // 3️⃣ Sort by newest first
    items.sort((a, b) => b.ts - a.ts);

    // 4️⃣ Apply limit
    const latest = items.slice(0, limit);

    return res.json({
      count: latest.length,
      items: latest
    });

  } catch (err) {
    console.error("FEED LATEST ERROR:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
