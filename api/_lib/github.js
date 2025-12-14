import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

/**
 * Read a JSON file from GitHub safely
 */
export async function readJSON(path) {
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    // ❌ If path is a directory, GitHub returns an array
    if (Array.isArray(res.data)) {
      throw new Error(`Path is a directory, not a file: ${path}`);
    }

    const raw = Buffer.from(res.data.content, "base64").toString("utf8");

    // ✅ Empty file → treat as empty object
    if (!raw.trim()) {
      return { json: {}, sha: res.data.sha };
    }

    return {
      json: JSON.parse(raw),
      sha: res.data.sha
    };

  } catch (err) {
    console.error("[readJSON failed]", path, err.message);

    // ❗ IMPORTANT:
    // Return null json so caller can decide what to do
    return { json: null, sha: null };
  }
}

/**
 * Write a JSON file to GitHub
 * Auto-creates file if missing
 */
export async function writeJSON(path, json, sha = null) {
  try {
    const content = Buffer
      .from(JSON.stringify(json, null, 2))
      .toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `update ${path}`,
      content,
      sha,
      branch
    });

  } catch (err) {
    console.error("[writeJSON failed]", path, err.message);
    throw err; // 🚨 Do NOT hide write failures
  }
}
