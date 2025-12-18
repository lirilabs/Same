import { Octokit } from "@octokit/rest";
import { readJSON, writeJSON } from "../../_lib/github.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    // ---------- SAFE BODY PARSE ----------
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { thoughtId, uid } = body || {};
    if (!thoughtId || !uid) {
      return res.status(400).json({ error: "Missing thoughtId or uid" });
    }

    // ---------- LIST DAILY FILES ----------
    const files = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/thoughts",
      ref: process.env.GITHUB_BRANCH
    });

    let found = null;

    // ---------- SEARCH ALL DAILY FILES ----------
    for (const file of files.data) {
      if (!file.name.endsWith(".json")) continue;

      const resJSON = await readJSON(`data/thoughts/${file.name}`);
      const list = Array.isArray(resJSON.json) ? resJSON.json : [];

      const idx = list.findIndex(t => t.id === thoughtId);
      if (idx !== -1) {
        found = {
          path: `data/thoughts/${file.name}`,
          list,
          idx,
          sha: resJSON.sha
        };
        break;
      }
    }

    if (!found) {
      return res.status(404).json({ error: "Thought not found" });
    }

    // ---------- TOGGLE LIKE ----------
    const thought = found.list[found.idx];

    if (!thought.likes) {
      thought.likes = { count: 0, users: {} };
    }
    if (!thought.likes.users) {
      thought.likes.users = {};
    }

    let liked;
    if (thought.likes.users[uid]) {
      delete thought.likes.users[uid];
      thought.likes.count = Math.max(0, thought.likes.count - 1);
      liked = false;
    } else {
      thought.likes.users[uid] = true;
      thought.likes.count++;
      liked = true;
    }

    found.list[found.idx] = thought;

    // ---------- SAVE BACK ----------
    await writeJSON(found.path, found.list, found.sha);

    return res.json({
      status: "ok",
      liked,
      count: thought.likes.count,
      file: found.path
    });

  } catch (err) {
    console.error("LIKE API ERROR:", err.message);
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
