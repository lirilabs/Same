import { Octokit } from "@octokit/rest";
import { decrypt } from "../_lib/encrypt.js";
import { readJSON } from "../_lib/github.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // 1️⃣ List files in data/thoughts/
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

    // 2️⃣ Read each file
    for (const file of listRes.data) {
      if (!file.name.endsWith(".json")) continue;

      const { json } = await readJSON(`data/thoughts/${file.name}`);
      if (!Array.isArray(json)) continue;

      for (const entry of json) {
        try {
          items.push({
            id: entry.id,
            text: decrypt(entry.raw_encrypted),
            uid: entry.uid,
            semantic: entry.semantic,
            ts: entry.ts
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
    console.error("READ FEED CRASH:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
