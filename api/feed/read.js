import { Octokit } from "@octokit/rest";
import { readJSON } from "../_lib/github.js";
import { decrypt } from "../_lib/encrypt.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

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
        let decrypted;

        try {
          decrypted = decrypt(entry.raw_encrypted);
        } catch {
          continue;
        }

        if (!decrypted) continue;

        items.push({
          id: entry.id,
          uid: entry.uid,
          raw_encrypted: decrypted, // ✅ SAME KEY, DECRYPTED VALUE
          semantic: entry.semantic,
          ts: entry.ts
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
