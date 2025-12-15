import { Octokit } from "@octokit/rest";
import { readJSON } from "../_lib/github.js";
import { decrypt } from "../_lib/encrypt.js";

/* ======================================================
   CORS
====================================================== */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

const DEFAULT_STYLE = {
  color: "#94A3B8",
  fontColor: "#E5E7EB",
  ratio: "4:5",
  font: "Inter",
  weight: 500,
  theme: "light"
};

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only" });
  }

  try {
    const listRes = await octokit.repos.getContent({
      owner,
      repo,
      path: "data/thoughts",
      ref: branch
    });

    if (!Array.isArray(listRes.data)) {
      return res.json({ count: 0, items: [] });
    }

    const items = [];

    for (const file of listRes.data) {
      if (!file.name.endsWith(".json")) continue;

      const { json } = await readJSON(`data/thoughts/${file.name}`);
      if (!Array.isArray(json)) continue;

      for (const entry of json) {
        if (!entry?.raw_encrypted) continue;

        let text;
        try {
          text = decrypt(entry.raw_encrypted);
        } catch {
          continue;
        }

        const likesObj = entry.likes || { count: 0, users: {} };

        items.push({
          id: entry.id,
          uid: entry.uid,
          text,
          semantic: entry.semantic || {},
          style: entry.style || DEFAULT_STYLE,
          ts: entry.ts,

          // ❤️ Likes
          likes: {
            count:
              typeof likesObj.count === "number"
                ? likesObj.count
                : Object.keys(likesObj.users || {}).length
          },

          // 🎵 Music clip (NEW)
          music: entry.music || null
        });
      }
    }

    items.sort((a, b) => b.ts - a.ts);

    return res.json({
      count: items.length,
      items
    });

  } catch (err) {
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
