import { readJSON } from "../_lib/github.js";
import { decrypt } from "../_lib/encrypt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // 1️⃣ List all files in data/thoughts
    const filesRes = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/thoughts?ref=${process.env.GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    const files = await filesRes.json();

    if (!Array.isArray(files)) {
      return res.json({ count: 0, items: [] });
    }

    const items = [];

    // 2️⃣ Read each day's file
    for (const file of files) {
      if (!file.name.endsWith(".json")) continue;

      const dayRes = await readJSON(`data/thoughts/${file.name}`);
      const list = Array.isArray(dayRes.json) ? dayRes.json : [];

      for (const item of list) {
        try {
          items.push({
            id: item.id,
            text: decrypt(item.raw_encrypted),
            semantic: item.semantic,
            uid: item.uid,
            ts: item.ts
          });
        } catch {
          // skip broken entries
        }
      }
    }

    // 3️⃣ Sort newest first
    items.sort((a, b) => b.ts - a.ts);

    return res.json({
      count: items.length,
      items
    });

  } catch (err) {
    console.error("READ FEED ERROR:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
