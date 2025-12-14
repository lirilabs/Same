import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  const userIndexRes = await readJSON("data/indexes/user-index.json");
  const userIndex = userIndexRes.json || {};

  const ids = userIndex[uid] || [];

  return res.json({
    count: ids.length,
    items: ids.map(id => ({ id }))
  });
}
