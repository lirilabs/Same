import { readJSON } from "./github.js";
import { decrypt } from "./encrypt.js";

export async function getMatchedFeed(uid) {
  // Load indexes (small files)
  const userIndex =
    (await readJSON("data/indexes/user-index.json")).json || {};
  const semanticIndex =
    (await readJSON("data/indexes/semantic-index.json")).json || {};

  const userPosts = userIndex[uid];
  if (!userPosts?.length) return [];

  const lastPostId = userPosts.at(-1);

  // Find semantic key of last post
  let semanticKey = null;
  for (const key in semanticIndex) {
    if (semanticIndex[key].includes(lastPostId)) {
      semanticKey = key;
      break;
    }
  }
  if (!semanticKey) return [];

  // Read ONLY today (fast)
  const today = new Date().toISOString().slice(0, 10);
  const thoughts =
    (await readJSON(`data/thoughts/${today}.json`)).json || [];

  // Match by ID
  return thoughts
    .filter(
      p =>
        semanticIndex[semanticKey].includes(p.id) &&
        p.uid !== uid
    )
    .map(p => ({
      id: p.id,
      uid: p.uid,
      text: decrypt(p.raw_encrypted),
      semantic: p.semantic,
      style: p.style,
      music: p.music || null,
      likes: p.likes || { count: 0 },
      ts: p.ts
    }))
    .sort((a, b) => b.ts - a.ts);
}
