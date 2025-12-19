import { readJSON } from "./github.js";

export async function getMatchedPosts(uid) {
  const userIndex = (await readJSON("data/indexes/user-index.json")).json || {};
  const semanticIndex = (await readJSON("data/indexes/semantic-index.json")).json || {};

  const userPosts = userIndex[uid];
  if (!userPosts?.length) return [];

  const lastPostId = userPosts.at(-1);

  let semanticKey = null;
  for (const key in semanticIndex) {
    if (semanticIndex[key].includes(lastPostId)) {
      semanticKey = key;
      break;
    }
  }
  if (!semanticKey) return [];

  const today = new Date().toISOString().slice(0, 10);
  const thoughts =
    (await readJSON(`data/thoughts/${today}.json`)).json || [];

  return thoughts.filter(
    p => semanticIndex[semanticKey].includes(p.id) && p.uid !== uid
  );
}
