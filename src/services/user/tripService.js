import { supabase } from '../../config/supabase';

/* =========================
   CREATE TRIP + OWNER
========================= */
export const createTrip = async (userId, tripName, destination = null) => {
  try {
    // 1. Create trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: tripName,
        destination,
        created_by: userId,
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // 2. Add owner (SAFE: avoids duplicate crash)
    const { error: memberError } = await supabase
      .from('trip_members')
      .upsert(
        {
          trip_id: trip.id,
          user_id: userId,
          role: 'owner',
        },
        { onConflict: 'trip_id,user_id' }
      );

    if (memberError) throw memberError;

    return { trip, error: null };
  } catch (error) {
    console.error('Create Trip Error:', error);
    return { trip: null, error };
  }
};

/* =========================
   GET USER TRIPS
========================= */
export const getUserTrips = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        trip_members(user_id, role)
      `);

    if (error) throw error;

    // ✅ FILTER IN FRONTEND (IMPORTANT)
    const filteredTrips = data.filter(
      (trip) =>
        trip.user_id === userId || // owner
        trip.trip_members?.some((m) => m.user_id === userId) // member
    );

    return { trips: filteredTrips };

  } catch (err) {
    console.error("Error fetching trips:", err);
    return { error: err };
  }
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