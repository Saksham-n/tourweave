import { supabase } from '../../config/supabase';

/**
 * Executes a powerful transaction-like sequence to create a Trip and explicitly bind
 * the creator to the Trip as an Owner! 
 */
export const createTrip = async (userId, tripName) => {
  // 1. Create the trip entity
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({ name: tripName, created_by: userId })
    .select()
    .single();

  if (tripError) return { trip: null, error: tripError };

  // 2. Bind the user to their newly created trip
  const { error: memberError } = await supabase
    .from('trip_members')
    .insert({ trip_id: trip.id, user_id: userId, role: 'owner' });

  if (memberError) return { trip: null, error: memberError };

  return { trip, error: null };
};

/**
 * Joins the `trips` and `trip_members` tables intelligently so we ONLY return
 * the exact chunks of data the active user is allowed to access.
 */
export const getUserTrips = async (userId) => {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      trip_members!inner(role)
    `)
    .eq('trip_members.user_id', userId)
    .order('created_at', { ascending: false });

  return { trips: data || [], error };
};

/**
 * Permanently drops a trip using its ID.
 */
export const deleteTrip = async (tripId) => {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);
  return { error };
};
