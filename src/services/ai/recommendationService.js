/**
 * recommendationService.js
 * Generates AI-curated destination recommendations based on search parameters.
 */

export const generateRecommendations = async ({ destination, interest, type }) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API Key not found in environment.");

  const systemPrompt = `You are an expert travel curator. The user will provide a broad destination, an interest, and a terrain/type.
Recommend exactly 3 specific places, attractions or towns inside that destination that perfectly match their criteria.
Respond ONLY with a valid JSON object matching exactly this structure:
{
  "recommendations": [
    {
      "name": "Name of the place",
      "description": "Short, compelling 2-sentence description of why it matches their interest and type.",
      "highlight": "One specific key highlight (e.g. 'Ancient cave murals')"
    }
  ]
}
Do not include markdown blocks, just raw JSON. Ensure there are no trailing commas.`;

  const userPrompt = `Destination: ${destination}\nInterest: ${interest}\nTerrain/Type: ${type}\n\nProvide 3 recommendations.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-small-creative',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenRouter Error response:", errText);
    throw new Error(`AI generation failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || "";

  // 1. Try to extract from a markdown code block if present
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    content = codeBlockMatch[1];
  }

  // 2. Use regex to locate the first '{' and the last '}'
  const firstBracket = content.indexOf('{');
  const lastBracket = content.lastIndexOf('}');

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    let jsonStr = content.substring(firstBracket, lastBracket + 1);
    // Strip out invalid control characters Mistral sometimes includes
    jsonStr = jsonStr.replace(/[\u0000-\u001F]/g, function (ch) {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
      return '';
    });

    try {
      const parsed = JSON.parse(jsonStr);
      return parsed.recommendations || [];
    } catch (err) {
      console.error("Failed to parse JSON array:", jsonStr);
      throw new Error("The AI response contained invalid JSON formatting.");
    }
  }

  console.error("No JSON array found in response:", content);
  throw new Error("The AI failed to return the expected recommendations list.");
};
