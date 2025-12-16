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

/* ======================================================
   GITHUB CONFIG
====================================================== */
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

/* ======================================================
   DEFAULT STYLE
====================================================== */
const DEFAULT_STYLE = {
  color: "#94A3B8",
  fontColor: "#E5E7EB",
  ratio: "4:5",
  font: "Inter",
  weight: 500,
  theme: "light"
};

/* ======================================================
   API HANDLER
====================================================== */
export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only" });
  }

  try {
    /* ---------- List all day files ---------- */
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

    /* ---------- Read each JSON file ---------- */
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
          continue; // skip corrupted entry
        }

        if (!text) continue;

        /* ---------- Likes handling ---------- */
        const likesObj =
          entry.likes && typeof entry.likes === "object"
            ? entry.likes
            : { users: {} };

        const likeUsers = Object.keys(likesObj.users || {});
        const likeCount = likeUsers.length;

        /* ---------- Push final item ---------- */
        items.push({
          id: entry.id,
          uid: entry.uid,
          text,
          semantic: entry.semantic || {},
          style: entry.style || DEFAULT_STYLE,
          ts: entry.ts,

          // ❤️ Likes (COUNT + UID LIST)
          likes: {
            count: likeCount,
            users: likeUsers
          },

          // 🎵 Music clip (optional)
          music: entry.music || null
        });
      }
    }

    /* ---------- Sort newest first ---------- */
    items.sort((a, b) => b.ts - a.ts);

    return res.json({
      count: items.length,
      items
    });

  } catch (err) {
    console.error("FEED READ ERROR:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
