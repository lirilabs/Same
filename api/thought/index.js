import { encrypt } from "../_lib/encrypt.js";
import { classifyThought } from "../_lib/classify.js";
import { readJSON, writeJSON } from "../_lib/github.js";
import { updateIndex } from "../_lib/indexer.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });

  const { text } = req.body || {};
  if (!text || text.length > 200)
    return res.status(400).json({ error: "Invalid text" });

  const semantic = await classifyThought(text);
  const encrypted = encrypt(text);

  const id = `t_${Date.now().toString(36)}`;
  const today = new Date().toISOString().slice(0, 10);
  const path = `data/thoughts/${today}.json`;

  const { json = [], sha } = await readJSON(path);

  json.push({
    id,
    ts: Date.now(),
    raw_encrypted: encrypted,
    semantic
  });

  await writeJSON(path, json, sha);

  const key = `${semantic.emotion}|${semantic.domain}|${semantic.intent}`;
  await updateIndex(key, id);

  res.json({
    status: "ok",
    message: "Thought stored",
    match_hint: "Someone thinks like you"
  });
}
