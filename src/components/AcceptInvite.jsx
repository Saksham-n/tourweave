import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { acceptInvitation } from "../services/user/invitationService";
import { useAuth } from "../context/AuthContext";

export default function AcceptInvite() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const handleAccept = async () => {
      // 🔐 If not logged in
      if (!user) {
        setStatus({ type: 'error', message: "Please login to join this trip." });
        setLoading(false);
        return;
      }

      try {
        const tripId = await acceptInvitation(token, user.id);
        setStatus({ type: 'success', message: "🎉 Joined trip successfully! Redirecting..." });
        
        // Delay redirect slightly for the user to see the success message
        setTimeout(() => {
          navigate(`/trips/${tripId}`);
        }, 2000);
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', message: err.message || "Invalid or expired invite" });
      } finally {
        setLoading(false);
      }
    };

    handleAccept();
  }, [token, user]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0b5851 0%, #1a1a1a 100%)',
      color: 'white',
      fontFamily: 'inherit'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '3rem',
        borderRadius: '24px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        maxWidth: '400px'
      }}>
        {loading ? (
          <h2 style={{ animation: 'pulse 1.5s infinite' }}>Joining Trip...</h2>
        ) : (
          <>
            <h2 style={{ color: status.type === 'error' ? '#ff5252' : '#4caf50' }}>
              {status.type === 'error' ? 'Oops!' : 'Welcome Aboard!'}
            </h2>
            <p style={{ marginTop: '1rem', fontSize: '1.1rem', opacity: 0.9 }}>{status.message}</p>
            {status.type === 'error' && (
              <button 
                onClick={() => navigate('/auth-test')}
                style={{
                  marginTop: '2rem',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'white',
                  color: '#0b5851',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Go to Login
              </button>
            )}
          </>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}