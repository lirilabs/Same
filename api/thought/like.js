import { Octokit } from "@octokit/rest";
import { readJSON, writeJSON } from "../_lib/github.js";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });

  try {
    const { thoughtId, uid } = req.body || {};

    if (!thoughtId || !uid) {
      return res.status(400).json({ error: "Missing thoughtId or uid" });
    }

    // 1️⃣ Find the thought by scanning daily files
    const today = new Date().toISOString().slice(0, 10);
    const path = `data/thoughts/${today}.json`;

    const result = await readJSON(path);
    const list = Array.isArray(result.json) ? result.json : [];

    const idx = list.findIndex(t => t.id === thoughtId);
    if (idx === -1) {
      return res.status(404).json({ error: "Thought not found" });
    }

    const thought = list[idx];

    // 2️⃣ Init likes
    if (!thought.likes) {
      thought.likes = { count: 0, users: {} };
    }

    // 3️⃣ Toggle like
    if (thought.likes.users[uid]) {
      // UNLIKE
      delete thought.likes.users[uid];
      thought.likes.count--;
    } else {
      // LIKE
      thought.likes.users[uid] = true;
      thought.likes.count++;
    }

    list[idx] = thought;

    // 4️⃣ Save back
    await writeJSON(path, list, result.sha);

    return res.json({
      status: "ok",
      liked: !!thought.likes.users[uid],
      count: thought.likes.count
    });

  } catch (err) {
    return res.status(500).json({
      error: "Internal error",
      detail: err.message
    });
  }
}
