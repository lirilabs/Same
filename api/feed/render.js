import { readJSON } from "../_lib/github.js";
import { decrypt } from "../_lib/encrypt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Invalid ids" });
  }

  // Load ID map
  const mapRes = await readJSON("data/indexes/id-map.json");
  const map = mapRes.json || {};

  const items = [];

  for (const id of ids) {
    const meta = map[id];
    if (!meta) continue;

    const fileRes = await readJSON(meta.path);
    const list = Array.isArray(fileRes.json) ? fileRes.json : [];
    const item = list[meta.index];
    if (!item) continue;

    items.push({
      id: item.id,
      text: decrypt(item.raw_encrypted), // 🔓 DECRYPTED HERE
      semantic: item.semantic,
      ts: item.ts
    });
  }

  return res.json({
    count: items.length,
    items
  });
}
