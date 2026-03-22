import { supabase } from '../../config/supabase';

/**
 * Fetch a user's Travel DNA document from the database.
 */
export const getTravelDNA = async (userId) => {
  const { data, error } = await supabase
    .from('travel_dna')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { dna: null, error };
  return { dna: data, error: null };
};

/**
 * Save a user's Travel DNA via upsert.
 * Uses .upsert() without .single() to avoid PostgREST PGRST116 hangs.
 */
export const upsertTravelDNA = async (userId, dnaData) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('travel_dna')
    .upsert(
      {
        user_id: userId,
        budget: dnaData.budget,
        travel_style: dnaData.travel_style,
        interests: dnaData.interests,
        preferred_destinations: dnaData.preferred_destinations,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )
    .select();

  if (error) return { dna: null, error };
  return { dna: data?.[0] ?? null, error: null };
};
