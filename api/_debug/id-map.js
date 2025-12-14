import { readJSON } from "../_lib/github.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const result = await readJSON("data/indexes/id-map.json");

    return res.json({
      exists: !!result.json,
      data: result.json
    });
  } catch (err) {
    return res.status(500).json({
      error: "Debug error",
      detail: err.message
    });
  }
}
