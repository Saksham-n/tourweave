import { supabase } from '../../config/supabase';

/**
 * Analyze sentiment using OpenRouter API
 */
const analyzeSentiment = async (content) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('OpenRouter API key not found');
    return { score: 0.5, label: 'neutral' };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a sentiment analysis expert. Analyze the sentiment of the given travel journal entry. Return ONLY a valid JSON object with two fields: "score" (number between 0 and 1, where 0 is very negative and 1 is very positive) and "label" (string: "positive", "neutral", or "negative"). No other text.',
          },
          {
            role: 'user',
            content: `Analyze this travel journal entry: "${content}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze sentiment');
    }

    const data = await response.json();
    const content_text = data.choices[0].message.content;

    // Parse JSON response
    const sentiment = JSON.parse(content_text);
    return {
      score: Math.max(0, Math.min(1, sentiment.score)),
      label: sentiment.label || 'neutral',
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { score: 0.5, label: 'neutral' };
  }
};

/**
 * Create a new journal entry with sentiment analysis
 */
export const createEntry = async (userId, { title, content }) => {
  try {
    // Analyze sentiment
    const sentiment = await analyzeSentiment(content);

    // Insert into database
    const { data, error } = await supabase.from('travel_journal_entries').insert([
      {
        user_id: userId,
        title,
        content,
        sentiment_score: sentiment.score,
        sentiment_label: sentiment.label,
      },
    ]);

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all journal entries for a user
 */
export const getEntries = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('travel_journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get a single journal entry
 */
export const getEntry = async (entryId) => {
  try {
    const { data, error } = await supabase
      .from('travel_journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a journal entry with sentiment re-analysis
 */
export const updateEntry = async (entryId, { title, content }) => {
  try {
    // Analyze sentiment
    const sentiment = await analyzeSentiment(content);

    // Update database
    const { data, error } = await supabase
      .from('travel_journal_entries')
      .update({
        title,
        content,
        sentiment_score: sentiment.score,
        sentiment_label: sentiment.label,
      })
      .eq('id', entryId);

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a journal entry
 */
export const deleteEntry = async (entryId) => {
  try {
    const { error } = await supabase.from('travel_journal_entries').delete().eq('id', entryId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get journal statistics for a user
 */
export const getJournalStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('travel_journal_entries')
      .select('sentiment_score, sentiment_label')
      .eq('user_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, data: { totalEntries: 0, averageSentiment: 0.5, mood: 'neutral' } };
    }

    const totalEntries = data.length;
    const averageSentiment =
      data.reduce((sum, entry) => sum + (entry.sentiment_score || 0), 0) / totalEntries;

    let mood = 'neutral';
    if (averageSentiment > 0.6) mood = 'positive';
    else if (averageSentiment < 0.4) mood = 'negative';

    return { success: true, data: { totalEntries, averageSentiment, mood } };
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    return { success: false, error: error.message };
  }
};
