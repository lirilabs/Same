import { readJSON, writeJSON } from "./github.js";
import { CACHE } from "./cache.js";

const INDEX_PATH = "data/indexes/semantic-index.json";

export async function updateIndex(key, thoughtId) {
  let index = CACHE.index;

  if (!index) {
    const { json } = await readJSON(INDEX_PATH);
    index = json || {};
  }

  if (!index[key]) index[key] = [];
  index[key].push(thoughtId);

  CACHE.index = index;
  CACHE.indexLoadedAt = Date.now();

  const { sha } = await readJSON(INDEX_PATH);
  await writeJSON(INDEX_PATH, index, sha);
}
