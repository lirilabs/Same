export async function classifyThought(text) {
  const prompt = `
You are an AI that classifies short human thoughts.

IMPORTANT RULES:
- You MUST choose the MOST SPECIFIC domain.
- DO NOT default to "life_events" unless no other domain fits.
- Infer the domain from meaning, not keywords.
- If multiple domains fit, choose the strongest one.
- Create context keywords from the text itself.

Return ONLY valid JSON.
NO explanations.

Schema:
{
  "emotion": "joy|sadness|anxiety|anger|calm|loneliness|hope|curiosity",
  "emotion_intensity": number,
  "domain": "family|relationships|career|education|health|sports|money|creativity|identity|life_events",
  "intent": "achievement|milestone|struggle|reflection|anticipation|relief|loss|gratitude|decision",
  "themes": [],
  "context_keywords": []
}

Domain selection guide (STRICT):
- family → parents, kids, home, relatives
- relationships → love, breakup, partner, dating, marriage
- career → job, work, office, business, promotion
- education → study, exam, college, school, learning
- health → illness, fitness, mental health, recovery
- sports → match, game, win, team, practice
- money → salary, debt, savings, expenses
- creativity → writing, music, art, ideas, building
- identity → self, purpose, confidence, who I am
- life_events → ONLY if none of the above apply

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
