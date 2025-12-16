export async function classifyThought(text) {
  const prompt = `
You classify short human thoughts.

RULES:
- You MAY return multiple domains (max 3).
- Choose domains based on meaning, not keywords.
- DO NOT default to "life_events".
- Always choose the most specific domains.
- Include "fashion" when clothing/style is involved.
- Include "shopping" when purchase is involved.

Return ONLY valid JSON. No explanations.

Schema:
{
  "emotion": "joy|sadness|anxiety|anger|calm|loneliness|hope|curiosity",
  "emotion_intensity": number,
  "domains": [],
  "intent": "achievement|milestone|struggle|reflection|anticipation|relief|loss|gratitude|decision",
  "themes": [],
  "context_keywords": []
}

Available domains:
- family
- relationships
- career
- education
- health
- sports
- money
- creativity
- identity
- fashion
- shopping
- life_events (ONLY if nothing else fits)

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
