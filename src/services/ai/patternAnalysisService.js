import { supabase } from '../../config/supabase';

/**
 * Aggregates all user data needed for pattern analysis
 */
export const aggregateUserTravelData = async (userId) => {
  const [tripsRes, journalsRes, dnaRes, dnaHistoryRes] = await Promise.all([
    supabase.from('trips').select('*').eq('created_by', userId).order('created_at'),
    supabase.from('travel_journal_entries').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('travel_dna').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('travel_dna_history').select('*').eq('user_id', userId).order('created_at')
  ]);

  const trips = tripsRes.data || [];
  const journals = journalsRes.data || [];
  
  // Need at least 1 trip or 1 journal OR strong DNA context to make an analysis
  const hasEnoughData = trips.length > 0 || journals.length > 0;

  // Compute sentiment average (assuming sentiment spans 1-5 where mostly 4s and 5s are positive)
  const sentiments = journals.filter(j => j.mood_score).map(j => j.mood_score);
  const avgSentiment = sentiments.length ? (sentiments.reduce((a, b) => a + b, 0) / sentiments.length).toFixed(1) : "N/A";

  return {
    hasEnoughData,
    totalTrips: trips.length,
    totalJournalEntries: journals.length,
    averageSentiment: avgSentiment,
    currentDNA: dnaRes.data,
    dnaUpdatesCount: (dnaHistoryRes.data || []).length,
    tripNames: trips.map(t => t.name).slice(-10), // Limit payload size
    journalTitles: journals.map(j => j.title).slice(-5)
  };
};

/**
 * Sends aggregated data to OpenRouter/Mistral for narrative pattern analysis
 */
export const generatePatternReport = async (aggregatedData) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API Key missing.");

  const systemPrompt = `You are TourWeave's behavioral travel analyst.
Given the user's aggregated travel statistics, respond with a JSON object dissecting their travel personality.
Format EXACTLY like this (NO markdown blocks, just raw JSON):
{
  "personalityType": "The Cultural Explorer",
  "narrative": "A 2-3 sentence engaging paragraph explaining how their trips and mood reflect this personality.",
  "insights": [
    "You tend to travel more when feeling adventurous.",
    "Your preferences have shifted from budget to luxury over time."
  ]
}`;

  const userContext = `
Data points for this user:
- Total collaborative Trips created: ${aggregatedData.totalTrips} (Examples: ${aggregatedData.tripNames.join(', ') || 'None'})
- Travel Journal Entries written: ${aggregatedData.totalJournalEntries} (Recent: ${aggregatedData.journalTitles.join(', ') || 'None'})
- Average Mood Score across all past trips (1-5): ${aggregatedData.averageSentiment}
- Current Travel Style Preference: ${aggregatedData.currentDNA?.travel_style || 'General'}
- Core Interests: ${aggregatedData.currentDNA?.interests?.join(', ') || 'Not specified'}
- Budget Level: ${aggregatedData.currentDNA?.budget || 'Moderate'}
- Number of times they changed their DNA profile: ${aggregatedData.dnaUpdatesCount}

Generate their Travel Personality Report now.`;

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
        { role: 'user', content: userContext },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenRouter Error:", errText);
    throw new Error(`Pattern analysis failed. (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "";

  // Robust JSON Extraction
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = content.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error("Parse error:", jsonStr);
      throw new Error("AI returned malformed JSON.");
    }
  }

  throw new Error("AI failed to return JSON format.");
};
