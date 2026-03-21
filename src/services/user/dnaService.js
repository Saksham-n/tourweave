import { supabase } from '../../config/supabase';

/**
 * Fetch a user's Travel DNA document from the database.
 * @param {string} userId 
 * @returns {Promise<{ dna: any, error: any }>}
 */
export const getTravelDNA = async (userId) => {
  const { data, error } = await supabase
    .from('travel_dna')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If no DNA exists yet, Postgres pgrest returns a PGRST116 row missing error, which is fine
  if (error && error.code === 'PGRST116') {
    return { dna: null, error: null };
  }

  return { dna: data, error };
};

/**
 * Update (Upsert) a user's Travel DNA data securely.
 * @param {string} userId 
 * @param {object} dnaData - { budget, travel_style, interests, preferred_destinations }
 * @returns {Promise<{ dna: any, error: any }>}
 */
export const upsertTravelDNA = async (userId, dnaData) => {
  const payload = {
    user_id: userId, // Ensure ID is forced securely
    ...dnaData,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('travel_dna')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  return { dna: data, error };
};
