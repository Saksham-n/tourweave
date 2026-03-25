import { supabase } from "../../config/supabase";

/* =========================
   GET ITINERARY
========================= */
export const getItinerary = async (trip_id) => {
  const { data, error } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("trip_id", trip_id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("GET ERROR:", error);
    return [];
  }

  return data;
};

/* =========================
   ADD ITEM
========================= */
export const addItineraryItem = async (item) => {
  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) {
      console.error("USER ERROR:", userError);
    }

    // ✅ Convert to ISO safely
    const startISO = item.start_time
      ? new Date(item.start_time).toISOString()
      : null;

    const endISO = item.end_time
      ? new Date(item.end_time).toISOString()
      : null;

    const { data, error } = await supabase
      .from("itinerary_items")
      .insert([
        {
          ...item,
          start_time: startISO,
          end_time: endISO,
          added_by: userData?.user?.id || null,
        },
      ])
      .select();

    if (error) {
      console.error("INSERT ERROR:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("UNEXPECTED ERROR:", err);
    return null;
  }
};

/* =========================
   UPDATE ITEM (EDIT ✏️)
========================= */
export const updateItineraryItem = async (id, updates) => {
  try {
    const startISO = updates.start_time
      ? new Date(updates.start_time).toISOString()
      : null;

    const endISO = updates.end_time
      ? new Date(updates.end_time).toISOString()
      : null;

    const { data, error } = await supabase
      .from("itinerary_items")
      .update({
        ...updates,
        start_time: startISO,
        end_time: endISO,
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("UPDATE ERROR:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("UPDATE EXCEPTION:", err);
    return null;
  }
};

/* =========================
   DELETE ITEM (🗑)
========================= */
export const deleteItineraryItem = async (id) => {
  try {
    const { error } = await supabase
      .from("itinerary_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE ERROR:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("DELETE EXCEPTION:", err);
    return false;
  }
};