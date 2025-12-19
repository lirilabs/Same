import { readFeed } from "../_lib/readFeed.js";
import { createThought } from "../_lib/createThought.js";
import { likeThought } from "../_lib/likeThought.js";
import { musicSearch } from "../_lib/musicSearch.js";
import { getMatchedFeed } from "../_lib/matchEngine.js";


export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const path = url.pathname.replace("/api", "");

  if (path === "" || path === "/") {
    return res.json({ name: "Same API", status: "running" });
  }

  if (path === "/feed/read") return readFeed(req, res);
  if (path === "/feed/matched") {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "uid required" });

    const items = await getMatchedFeed(uid);
    return res.json({ count: items.length, items });
  }

  if (path === "/thought/create") return createThought(req, res);
  if (path === "/thought/like") return likeThought(req, res);
  if (path === "/music/search") return musicSearch(req, res);

  res.status(404).json({ error: "Not found" });
}
