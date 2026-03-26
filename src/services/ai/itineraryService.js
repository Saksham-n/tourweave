import { supabase } from '../../config/supabase';

/**
 * Generate a day-by-day travel itinerary using the Mistral AI model via OpenRouter.
 */
export const generateItinerary = async ({ destination, days, budget, interests, travelStyle }) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API Key not found in environment.");

const systemPrompt = `You are TourWeave's expert India travel planner.
Create a realistic day-by-day itinerary for an India trip.
Respond ONLY with a valid JSON object matching exactly this structure:
{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "morning": "Morning activity description",
      "afternoon": "Afternoon activity description",
      "evening": "Evening activity description",
      "accommodation": "Suggested type or area to stay",
      "estimatedCost": "Estimated daily cost range in INR (₹XXX–₹YYY)"
    }
  ]
}
Do not include markdown blocks, just raw JSON. 
Ensure there are no trailing commas. Do NOT use literal newlines inside string values; use space instead. 
CRITICAL: Do NOT use double quotes (") inside your string values! Use single quotes (') instead if needed. This breaks JSON parsing.
Ensure realism regarding travel time.`;

  const userPrompt = `Trip Details:
- Destination: ${destination}
- Duration: ${days} days
- Budget Tier: ${budget}
- Travel Style: ${travelStyle || 'General sightseeing'}
- Core Interests: ${interests?.join(', ') || 'Not specified'}

Please generate my structured ${days}-day itinerary.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-small-creative',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
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
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    let jsonStr = content.substring(firstBrace, lastBrace + 1);
    
    // 3. Strip out invalid control characters Mistral sometimes includes
    jsonStr = jsonStr.replace(/[\u0000-\u001F]/g, function (ch) {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
      return '';
    });

    // 4. Aggressively remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to parse JSON string:", jsonStr);
      throw new Error(`The AI response contained invalid JSON: ${err.message}`);
    }
  }

  console.error("No JSON structure found in response:", content);
  throw new Error("The AI failed to return any JSON format.");
};

/**
 * Save an itinerary to Supabase.
 */
export const saveItinerary = async (tripId, userId, itineraryData) => {
  const { data, error } = await supabase
    .from('itineraries')
    .upsert(
      {
        trip_id: tripId,
        user_id: userId,
        days: itineraryData.days,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'trip_id' } // Note: we should add a unique constraint on trip_id if we want 1 itinerary per trip
    )
    .select()
    .single();

  if (error) {
    console.error("Error saving itinerary:", error);
    return { data: null, error };
  }
  return { data, error: null };
};

/**
 * Fetch an itinerary from Supabase for a specific trip.
 */
export const getItinerary = async (tripId) => {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('trip_id', tripId)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data, error: null };
};
