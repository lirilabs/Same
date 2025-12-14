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

  const { id, uid } = req.query;

  // 🔴 HARD VALIDATION
  if (!id || !uid) {
    return res.status(400).json({
      error: "Missing id or uid"
    });
  }

  try {
    // 1️⃣ List thought files
    const listRes = await octokit.repos.getContent({
      owner,
      repo,
      path: "data/thoughts",
      ref: branch
    });

    if (!Array.isArray(listRes.data)) {
      return res.status(404).json({ error: "No thoughts found" });
    }

    // 2️⃣ Search every file
    for (const file of listRes.data) {
      if (!file.name.endsWith(".json")) continue;

      const { json } = await readJSON(`data/thoughts/${file.name}`);
      if (!Array.isArray(json)) continue;

      const post = json.find(p => p.id === id);
      if (!post) continue;

      // 3️⃣ Permission check
      if (post.uid !== uid) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // 4️⃣ Decrypt safely
      let text;
      try {
        text = decrypt(post.raw_encrypted);
      } catch {
        return res.status(500).json({ error: "Decrypt failed" });
      }

      return res.json({ id, text });
    }

    return res.status(404).json({ error: "Post not found" });

  } catch (err) {
    console.error("DECRYPT CRASH:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
