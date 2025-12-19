export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const path = url.pathname.replace("/api", "");

  if (path === "" || path === "/") {
    return res.json({ name: "Same API", status: "running" });
  }

  if (path === "/feed/read") return readFeed(req, res);
  if (path === "/thought/create") return createThought(req, res);
  if (path === "/thought/like") return likeThought(req, res);
  if (path === "/music/search") return musicSearch(req, res);

  res.status(404).json({ error: "Not found" });
}
