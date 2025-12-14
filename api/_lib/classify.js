export async function classifyThought(text) {
  const prompt = `
Classify the following thought into structured meaning.

Return ONLY valid JSON with:
- emotion (one of: joy, sadness, anxiety, anger, calm, loneliness, hope, curiosity)
- emotion_intensity (number 0.1 to 1.0)
- domain (one of: family, relationships, career, education, health, sports, money, creativity, identity, life_events)
- intent (one of: achievement, milestone, struggle, reflection, anticipation, relief, loss, gratitude, decision)
- themes (array, max 2)
- context_keywords (array, max 3)

Thought:
"${text}"
`;

  const res = await fetch(
    `https://text.pollinations.ai/${encodeURIComponent(prompt)}`
  );

  const raw = await res.text();

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}
