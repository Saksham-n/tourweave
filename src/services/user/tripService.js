import { supabase } from '../../config/supabase';

/**
 * Executes a powerful transaction-like sequence to create a Trip and explicitly bind
 * the creator to the Trip as an Owner! 
 */
export const createTrip = async (userId, tripData) => {
  const { name, destination, start_date, end_date } = tripData;
  
  // 1. Create the trip entity
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({ 
      name, 
      destination, 
      start_date, 
      end_date, 
      created_by: userId 
    })
    .select()
    .single();

  if (tripError) return { trip: null, error: tripError };

  // 2. Bind the user to their newly created trip
  const { error: memberError } = await supabase
    .from('trip_members')
    .insert({ trip_id: trip.id, user_id: userId, role: 'owner' });

  // If the error is a duplicate key, it means a Supabase PostgreSQL Trigger already automatically added them as an owner!
  if (memberError && !memberError.message.includes('duplicate key value')) {
    return { trip: null, error: memberError };
  }

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

/* =========================
   GET SINGLE TRIP
========================= */
export const getTripById = async (tripId) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) throw error;

    return { trip: data, error: null };
  } catch (error) {
    console.error('Get Trip Error:', error);
    return { trip: null, error };
  }
};

/* =========================
   UPDATE TRIP
========================= */
export const updateTrip = async (tripId, updates) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;

    return { trip: data, error: null };
  } catch (error) {
    console.error('Update Trip Error:', error);
    return { trip: null, error };
  }
};

/* =========================
   DELETE TRIP
========================= */
export const deleteTrip = async (tripId) => {
  try {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Delete Trip Error:', error);
    return { error };
  }
};

/* =========================
   MEMBERSHIP FUNCTIONS
========================= */

// Add member (SAFE)
export const addMemberToTrip = async (tripId, userId) => {
  try {
    const { data, error } = await supabase
      .from('trip_members')
      .upsert(
        {
          trip_id: tripId,
          user_id: userId,
          role: 'member',
        },
        { onConflict: 'trip_id,user_id' }
      )
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Add Member Error:', error);
    return { data: null, error };
  }
};

// Remove member
export const removeMemberFromTrip = async (tripId, userId) => {
  try {
    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Remove Member Error:', error);
    return { error };
  }
};

/**
 * Subscribes to changes in trips where the user is a member.
 */
export const subscribeToUserTrips = (userId, onUpdate) => {
  return supabase
    .channel(`user_trips:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trips',
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trip_members',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();
};

// Get all members
export const getTripMembers = async (tripId) => {
  try {
    const { data, error } = await supabase
      .from('trip_members')
      .select('*')
      .eq('trip_id', tripId);

    if (error) throw error;

    return { members: data || [], error: null };
  } catch (error) {
    console.error('Get Members Error:', error);
    return { members: [], error };
  }
};

// Check if user is part of trip
export const isUserInTrip = async (tripId, userId) => {
  try {
    const { data, error } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle(); // ✅ better than .single()

    if (error) throw error;

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Check Member Error:', error);
    return { exists: false, error };
  }
};

/* =========================
   REALTIME SUBSCRIPTION
========================= */
export const subscribeToTrips = (callback) => {
  return supabase
    .channel('trips-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trips',
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
};