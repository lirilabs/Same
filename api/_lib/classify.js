export async function classifyThought(text) {
  const prompt = `
Return ONLY valid JSON.

Schema:
{
  "emotion": "joy|sadness|anxiety|anger|calm|loneliness|hope|curiosity",
  "emotion_intensity": number,
  "domain": "family|relationships|career|education|health|sports|money|creativity|identity|life_events",
  "intent": "achievement|milestone|struggle|reflection|anticipation|relief|loss|gratitude|decision",
  "themes": [],
  "context_keywords": []
}

Thought:
"${text}"
`;

  const res = await fetch(
    "https://text.pollinations.ai/" + encodeURIComponent(prompt)
  );

  const raw = await res.text();

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("AI did not return JSON");
  }

  return JSON.parse(raw.slice(start, end + 1));
}
