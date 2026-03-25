import { supabase } from "../../config/supabase";

/**
 * Fetch all itinerary items for a specific trip, sorted by date and time.
 */
export const getItineraryItems = async (tripId) => {
  const { data, error } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('date', { ascending: true, nullsFirst: false })
    .order('time', { ascending: true, nullsFirst: false });

  return { items: data || [], error };
};

/**
 * Add a new stop/item to the trip itinerary.
 */
export const addItineraryItem = async (itemData) => {
  const { data, error } = await supabase
    .from('itinerary_items')
    .insert([itemData])
    .select()
    .single();

  return { item: data, error };
};

/**
 * Edit an existing itinerary item.
 */
export const updateItineraryItem = async (itemId, updates) => {
  const { data, error } = await supabase
    .from('itinerary_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  return { item: data, error };
};

/**
 * Delete an itinerary item.
 */
export const deleteItineraryItem = async (itemId) => {
  const { error } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('id', itemId);

  return { error };
};

/**
 * Groups itinerary items by date for the UI timeline.
 */
export const groupItineraryByDay = (items) => {
  return items.reduce((groups, item) => {
    const date = item.date || 'Unscheduled';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});
};

/**
 * Set up a Realtime subscription for itinerary changes.
 */
export const subscribeToItinerary = (tripId, onUpdate) => {
  return supabase
    .channel(`itinerary:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'itinerary_items',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();
};
