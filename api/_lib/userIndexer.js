import { readJSON, writeJSON } from "./github.js";

const USER_INDEX_PATH = "data/indexes/user-index.json";

export async function updateUserIndex(uid, thoughtId) {
  const result = await readJSON(USER_INDEX_PATH);
  const index =
    result.json && typeof result.json === "object" ? result.json : {};

  if (!Array.isArray(index[uid])) {
    index[uid] = [];
  }

  index[uid].push(thoughtId);

  await writeJSON(USER_INDEX_PATH, index, result.sha);
}
