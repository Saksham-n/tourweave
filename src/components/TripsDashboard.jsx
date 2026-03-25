import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTrip, getUserTrips, deleteTrip } from '../services/user/tripService';
import { sendInvitation } from '../services/user/invitationService';
import './TripsDashboard.css';

const TripsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ✅ Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // ✅ NEW: Toast state
  const [toast, setToast] = useState('');

  const fetchTrips = async () => {
    if (!user) return;
    const { trips } = await getUserTrips(user.id);
    if (trips) setTrips(trips);
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const handleSpawnTrip = async () => {
    if (!newTripName.trim()) {
      setErrorMsg('Trip name required!');
      return;
    }

    setIsSpawning(true);
    const { error } = await createTrip(user.id, newTripName);

    if (error) setErrorMsg(error.message);
    else {
      setNewTripName('');
      fetchTrips();
    }

    setIsSpawning(false);
  };

  const handleDeleteTrip = async (tripId) => {
    const { error } = await deleteTrip(tripId);

    if (error) {
      setErrorMsg(error.message);
    } else {
      fetchTrips();
      setToast("🗑 Trip deleted");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const openInviteModal = (tripId) => {
    setSelectedTripId(tripId);
    setShowInviteModal(true);
  };

  // ✅ UPDATED FUNCTION (NO ALERT)
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      setToast("⚠ Enter email");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    try {
      await sendInvitation(selectedTripId, inviteEmail, user.id);

      setToast("✅ Invitation sent successfully!");
      setShowInviteModal(false);
      setInviteEmail('');

      setTimeout(() => setToast(""), 3000);

    } catch (err) {
      console.error("FULL ERROR:", err);
      setToast("❌ Failed to send invite");
      setTimeout(() => setToast(""), 3000);
    }
  };

  return (
    <div className="trips-page-container">
      <div className="trips-overlay"></div>

      <div className="trips-wrapper">

        <div className="trips-hero-text">
          <h1>Collaborative Trips</h1>
          <p>Create trips and invite members</p>
        </div>

        <div className="trip-spawner">
          <input
            type="text"
            placeholder="Trip name..."
            value={newTripName}
            onChange={(e) => setNewTripName(e.target.value)}
          />
          <button onClick={handleSpawnTrip}>
            {isSpawning ? 'Creating...' : 'Create Trip'}
          </button>
        </div>

        {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}

        <div className="trips-bento-grid">
          {trips.map(t => {
            const role = t.trip_members?.[0]?.role || 'viewer';

            const isJoined = t.trip_members?.some(
              m => m.user_id === user.id
            );

            const memberCount = t.trip_members?.length ?? 0;

            return (
              <div key={t.id} className="trip-card">

                <div onClick={() => navigate(`/trip/${t.id}`)}>

                  <div className="trip-card-header">
                    <div>
                      <h3>{t.name}</h3>
                      <span className={`trip-role ${role}`}>{role}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>

                      {role === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openInviteModal(t.id);
                          }}
                          className="invite-btn"
                        >
                          + Member
                        </button>
                      )}

                      {role === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(t.id);
                          }}
                          className="delete-btn"
                        >
                          🗑
                        </button>
                      )}

                    </div>
                  </div>

                  <p style={{ marginTop: "8px", color: "#666" }}>
                    👥 Members: {memberCount}
                  </p>

                  {isJoined && (
                    <span style={{
                      background: "#4caf50",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      marginTop: "5px",
                      display: "inline-block"
                    }}>
                      Joined
                    </span>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Invite Member</h3>

            <input
              type="email"
              placeholder="Enter email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />

            <div style={{ marginTop: 10, display: 'flex', gap: '10px' }}>
              <button onClick={handleSendInvite}>Send</button>
              <button onClick={() => setShowInviteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ TOAST UI */}
      {toast && <div className="toast">{toast}</div>}

    </div>
  );
};

export default TripsDashboard;