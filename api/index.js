export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const path = url.pathname.replace("/api", "");

  // 👉 Welcome route
  if (path === "" || path === "/") {
    return res.status(200).json({
      name: "Same API",
      status: "running",
      message: "Welcome to Same 🚀",
      version: "1.0.0"
    });
  }

  // Other routes
  if (path === "/thought/create") {
    return createThought(req, res);
  }

  if (path === "/feed/read") {
    return readFeed(req, res);
  }

  if (path === "/thought/like") {
    return likeThought(req, res);
  }

  return res.status(404).json({ error: "Route not found" });
}
