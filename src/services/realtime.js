import { supabase } from "../config/supabase";

/* =========================
   REALTIME: ITINERARY
========================= */
export const subscribeToItinerary = (trip_id, callback) => {
  const channel = supabase
    .channel(`itinerary-${trip_id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "itinerary_items",
        filter: `trip_id=eq.${trip_id}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return channel;
};