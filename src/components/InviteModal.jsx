import { useState } from "react";
import { sendInvitation } from "../services/user/invitationService";
import { useAuth } from "../context/AuthContext";

export default function InviteModal({ tripId, onClose }) {
  const [email, setEmail] = useState("");
  const { user } = useAuth();

  const handleInvite = async () => {
    try {
      const link = await sendInvitation(tripId, email, user.id);
      alert("Invite sent! Link: " + link);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error sending invite");
    }
  };

  return (
    <div className="modal">
      <h3>Invite Member</h3>
      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleInvite}>Send Invite</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}