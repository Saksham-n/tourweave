import { supabase } from '../../config/supabase';

/**
 * Fetch a user's extended profile document from the database.
 * @param {string} userId 
 * @returns {Promise<{ profile: any, error: any }>}
 */
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { profile: data, error };
};

/**
 * Update a user's extended profile data.
 * @param {string} userId 
 * @param {object} profileData - { bio, location, photo_url, display_name }
 * @returns {Promise<{ profile: any, error: any }>}
 */
export const updateProfile = async (userId, profileData) => {
  // Automatically manage the updated_at timestamp
  const payload = {
    ...profileData,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  return { profile: data, error };
};
