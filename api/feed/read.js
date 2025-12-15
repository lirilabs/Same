import { Octokit } from "@octokit/rest";
import { readJSON } from "../_lib/github.js";
import { decrypt } from "../_lib/encrypt.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

const DEFAULT_STYLE = {
  color: "#94A3B8",
  ratio: "4:5",
  font: "Inter",
  weight: 500,
  theme: "light"
};

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
        let text;
        try {
          text = decrypt(entry.raw_encrypted);
        } catch {
          continue;
        }

        if (!text) continue;

        items.push({
          id: entry.id,
          uid: entry.uid,
          text,
          semantic: entry.semantic,
          style: entry.style || DEFAULT_STYLE,
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
