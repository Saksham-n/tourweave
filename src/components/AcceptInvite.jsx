import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { acceptInvitation } from "../services/user/invitationService";
import { useAuth } from "../context/AuthContext";

export default function AcceptInvite() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAccept = async () => {
      // 🔐 If not logged in
      if (!user) {
        alert("Please login first");
        navigate("/auth-test");
        return;
      }

      try {
        await acceptInvitation(token, user.id);

        alert("🎉 Joined trip successfully!");

        // ✅ Redirect to trips page
        navigate("/trips");
      } catch (err) {
        console.error(err);
        alert(err.message || "Invalid or expired invite");
      } finally {
        setLoading(false);
      }
    };

    handleAccept();
  }, [token, user]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      {loading ? <h2>Joining Trip...</h2> : <h2>Done ✅</h2>}
    </div>
  );
}