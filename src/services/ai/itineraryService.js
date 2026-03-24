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
Do not include markdown blocks, just raw JSON. Ensure realism regarding travel time between places.`;

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
  const content = data.choices?.[0]?.message?.content?.trim() || "";


  // Use regex to locate the first '{' and the last '}' across the entire response
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = content.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to parse extracted JSON block:", jsonStr);
      throw new Error("The AI response contained invalid JSON.");
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
