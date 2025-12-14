import { readJSON, writeJSON } from "./github.js";
import { CACHE } from "./cache.js";

const INDEX_PATH = "data/indexes/semantic-index.json";

export async function updateIndex(key, thoughtId) {
  const result = await readJSON(INDEX_PATH);
  const index =
    result.json && typeof result.json === "object" ? result.json : {};

  if (!Array.isArray(index[key])) {
    index[key] = [];
  }

  index[key].push(thoughtId);

  CACHE.index = index;
  CACHE.indexLoadedAt = Date.now();

  await writeJSON(INDEX_PATH, index, result.sha);
}
