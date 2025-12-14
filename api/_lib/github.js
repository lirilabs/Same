import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH;

export async function readJSON(path) {
  try {
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    const content = Buffer.from(res.data.content, "base64").toString();
    return { json: JSON.parse(content), sha: res.data.sha };
  } catch {
    return { json: null, sha: null };
  }
}

export async function writeJSON(path, json, sha = null) {
  const content = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: `update ${path}`,
    content,
    sha,
    branch
  });
}

