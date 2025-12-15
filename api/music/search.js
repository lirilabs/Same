export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only" });
  }

  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Missing search query" });
    }

    const url =
      `https://jiosavan-api-with-playlist.vercel.app/api/search/songs` +
      `?query=${encodeURIComponent(query)}&page=0&limit=10`;

    const apiRes = await fetch(url);
    const apiData = await apiRes.json();

    if (!apiData?.success || !apiData?.data?.results) {
      return res.json({ count: 0, items: [] });
    }

    const items = apiData.data.results.map(song => {
      // 🎵 Clean song name
      const name = song.name?.trim() || "Unknown";

      // 🎤 Primary artist
      const artist =
        song.artists?.primary?.map(a => a.name).join(", ") || "Unknown Artist";

      // 🖼️ Best image (500x500)
      const image =
        song.image?.find(i => i.quality === "500x500")?.url ||
        song.image?.[song.image.length - 1]?.url ||
        null;

      // 🔊 Best audio (320kbps)
      const audio =
        song.downloadUrl?.find(d => d.quality === "320kbps")?.url ||
        song.downloadUrl?.[song.downloadUrl.length - 1]?.url ||
        null;

      return {
        id: song.id,
        title: name,
        artist,
        album: song.album?.name || "",
        duration: song.duration,
        year: song.year,
        image,
        audio,
        language: song.language,
        explicit: song.explicitContent,
        playCount: song.playCount,
        source: "jiosaavn"
      };
    });

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
