import { supabase } from "../../config/supabase";
import emailjs from "emailjs-com";

// ✅ SEND INVITATION
export const sendInvitation = async (tripId, email, invitedBy) => {
  try {
    const token = crypto.randomUUID();

    // ✅ Save invite in DB
    const { error } = await supabase
      .from("trip_invitations")
      .insert([
        {
          trip_id: tripId,
          email,
          token,
          invited_by: invitedBy,
          status: "pending",
        },
      ]);

    if (error) throw error;

    // ✅ Create invite link
    const inviteLink = `${window.location.origin}/accept-invite/${token}`;

    console.log("Invite Link:", inviteLink);

    // ✅ Send email
    await emailjs.send(
      "service_wsla4cn",
      "template_oiihw84",
      {
        to_email: email,
        invite_link: inviteLink,
      },
      "g7a4PHyimAQ56HSyM"
    );

    return inviteLink;

  } catch (err) {
    console.error("Invite Error:", err);
    throw err;
  }
};

// ✅ ACCEPT INVITATION
export const acceptInvitation = async (token, userId) => {
  try {
    // 🔍 Get invite
    const { data: invite, error } = await supabase
      .from("trip_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !invite) throw new Error("Invalid invite");

    // 🔒 Check if already member
    const { data: existing } = await supabase
      .from("trip_members")
      .select("*")
      .eq("trip_id", invite.trip_id)
      .eq("user_id", userId);

    if (!existing || existing.length === 0) {
      // ✅ Add to trip_members
      const { error: memberError } = await supabase
        .from("trip_members")
        .insert([
          {
            trip_id: invite.trip_id,
            user_id: userId,
            role: "editor",
          },
        ]);

      if (memberError) throw memberError;
    }

    // ✅ Update invitation status
    await supabase
      .from("trip_invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    return invite.trip_id;

  } catch (err) {
    console.error("Accept Invite Error:", err);
    throw err;
  }
};