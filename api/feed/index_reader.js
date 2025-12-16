import { readJSON } from "../_lib/github.js";

/* ===============================
   CORS
================================ */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/* ===============================
   API HANDLER
================================ */
export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only" });
  }

  try {
    const { json } = await readJSON(
      "data/indexes/semantic-index.json"
    );

    return res.json({
      success: true,
      index: json || {}
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to read index",
      detail: err.message
    });
  }
}
