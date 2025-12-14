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
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  try {
    const listRes = await octokit.repos.getContent({
      owner,
      repo,
      path: "data/thoughts",
      ref: branch
    });

    if (!Array.isArray(listRes.data)) {
      return res.status(404).json({ error: "No thoughts folder" });
    }

    for (const file of listRes.data) {
      if (!file.name.endsWith(".json")) continue;

      const { json } = await readJSON(`data/thoughts/${file.name}`);
      if (!Array.isArray(json)) continue;

      const post = json.find(p => p.id === id);
      if (!post) continue;

      const text = decrypt(post.raw_encrypted);
      return res.json({ id, text });
    }

    return res.status(404).json({ error: "Post not found" });

  } catch (err) {
    return res.status(500).json({
      error: "Decrypt failed",
      detail: err.message
    });
  }
}
