import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const result = await readJSON("data/indexes/id-map.json");

  return res.json({
    exists: !!result.json,
    data: result.json
  });
}
