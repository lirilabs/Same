import { CACHE, INDEX_TTL } from "../_lib/cache.js";
import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { emotion, domain, intent } = req.query;
  if (!emotion || !domain || !intent) {
    return res.status(400).json({ error: "Missing params" });
  }

  const now = Date.now();

  if (!CACHE.index || now - CACHE.indexLoadedAt > INDEX_TTL) {
    const result = await readJSON("data/indexes/semantic-index.json");
    CACHE.index = result.json || {};
    CACHE.indexLoadedAt = now;
  }

  const key = `${emotion}|${domain}|${intent}`;
  const ids = CACHE.index[key] || [];

  return res.json({
    count: ids.length,
    items: ids.map(id => ({ id }))
  });
}
