import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const mapRes = await readJSON("data/indexes/id-map.json");
  const map = mapRes.json || {};

  const meta = map[id];
  if (!meta) return res.status(404).json({ error: "Not found" });

  const fileRes = await readJSON(meta.path);
  const list = Array.isArray(fileRes.json) ? fileRes.json : [];

  const item = list[meta.index];
  if (!item) return res.status(404).json({ error: "Missing content" });

  return res.json({
    id: item.id,
    ts: item.ts,
    semantic: item.semantic
  });
}
