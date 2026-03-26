import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTrip, getUserTrips, deleteTrip } from '../services/user/tripService';
import { getTravelDNA } from '../services/user/dnaService';
import { generateItinerary, saveItinerary, getItinerary } from '../services/ai/itineraryService';
import ItineraryView from './ItineraryView';
import { sendInvitation } from '../services/user/invitationService';
import './TripsDashboard.css';

const TripsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [newTrip, setNewTrip] = useState({
    name: '',
    destination: '',
    start_date: '',
    end_date: ''
  });
  const [isSpawning, setIsSpawning] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());

  // ✅ Delete/Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // ✅ Toast state
  const [toast, setToast] = useState('');

  const fetchTrips = async () => {
    if (!user) return;
    const { trips } = await getUserTrips(user.id);
    if (trips) setTrips(trips);
  };

  useEffect(() => {
    fetchTrips();

    // Close datepicker when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-input-group')) {
        setActiveDatePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  // Auto-jump to the selected date's month when opening the datepicker
  useEffect(() => {
    if (activeDatePicker === 'start' && newTrip.start_date) {
      const [y, m, d] = newTrip.start_date.split('-');
      setViewDate(new Date(y, m - 1, d));
    } else if (activeDatePicker === 'end' && newTrip.end_date) {
      const [y, m, d] = newTrip.end_date.split('-');
      setViewDate(new Date(y, m - 1, d));
    }
  }, [activeDatePicker, newTrip.start_date, newTrip.end_date]);

  const handleSpawnTrip = async () => {
    if (!newTrip.name.trim()) {
      setToast('⚠ Your trip needs a name before we can continue!');
      setTimeout(() => setToast(""), 4000);
      return;
    }
    
    setIsSpawning(true);
    
    const { error } = await createTrip(user.id, newTrip);
    
    if (error) {
      setToast(`❌ Error: ${error.message}`);
      setTimeout(() => setToast(""), 5000);
    } else {
      setNewTrip({
        name: '',
        destination: '',
        start_date: '',
        end_date: ''
      });
      fetchTrips();
      setToast("✨ New Trip Created!");
      setTimeout(() => setToast(""), 3000);
    }
    
    setIsSpawning(false);
  };

  const initiateDelete = (trip) => {
    setTripToDelete(trip);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;
    
    const { error } = await deleteTrip(tripToDelete.id);
    setShowDeleteModal(false);

    if (error) {
      setToast(`❌ Error: ${error.message}`);
      setTimeout(() => setToast(""), 5000);
    } else {
      fetchTrips();
      setToast("🗑 Trip deleted successfully");
      setTimeout(() => setToast(""), 3000);
    }
    setTripToDelete(null);
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

  const renderDatePicker = (type) => {
    const isStart = type === 'start';
    const value = isStart ? newTrip.start_date : newTrip.end_date;
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay(); // 0 = Sunday, 6 = Saturday
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
      <div className={`datepicker-card ${activeDatePicker === type ? 'show' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', marginBottom: '10px', color: '#0b5851' }}>
          <span style={{ cursor: 'pointer', padding: '0 5px' }} onClick={() => setViewDate(new Date(year, month - 1, 1))}>&lt;</span>
          <span>{monthNames[month]} {year}</span>
          <span style={{ cursor: 'pointer', padding: '0 5px' }} onClick={() => setViewDate(new Date(year, month + 1, 1))}>&gt;</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="dp-date empty" style={{ cursor: 'default' }}></div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <div key={day} className={`dp-date ${value === dateStr ? 'selected' : ''}`} onClick={() => {
                setNewTrip({ ...newTrip, [isStart ? 'start_date' : 'end_date']: dateStr });
                setActiveDatePicker(null);
              }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="trips-page-container">
      <div className="trips-overlay"></div>

      <div className="trips-wrapper">
        <nav className="profile-nav">
          <div className="profile-logo" onClick={() => navigate('/')}>TourWeave</div>
          <div className="nav-links">
            <span onClick={() => navigate('/journal')}>Journal</span>
            <span onClick={() => navigate('/profile')}>Profile</span>
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
          </div>
        </nav>

        <div className="trips-hero-text">
          <h1>Collaborative Trips</h1>
          <p>Instantiate a new journey and invite travelers.</p>
        </div>

        <div className="trip-spawner-expanded">
          <div className="spawner-row">
            <input 
              type="text" 
              placeholder="Trip Name (e.g. Himalayas 2026)" 
              value={newTrip.name} 
              onChange={e => setNewTrip({...newTrip, name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Destination (e.g. Manali, India)" 
              value={newTrip.destination} 
              onChange={e => setNewTrip({...newTrip, destination: e.target.value})}
            />
          </div>
          <div className="spawner-row">
            <div className="date-input-group">
              <label>Starts</label>
              <input 
                type="text" 
                placeholder="Select start date..."
                value={newTrip.start_date} 
                onClick={() => setActiveDatePicker(activeDatePicker === 'start' ? null : 'start')}
                readOnly
                style={{ cursor: 'pointer' }}
              />
              {renderDatePicker('start')}
            </div>
            <div className="date-input-group">
              <label>Ends</label>
              <input 
                type="text" 
                placeholder="Select end date..."
                value={newTrip.end_date} 
                onClick={() => setActiveDatePicker(activeDatePicker === 'end' ? null : 'end')}
                readOnly
                style={{ cursor: 'pointer' }}
              />
              {renderDatePicker('end')}
            </div>
            <button onClick={handleSpawnTrip} disabled={isSpawning} className="spawn-btn">
              {isSpawning ? 'Spawning...' : 'Create Trip'}
            </button>
          </div>
        </div>


        <div className="trips-bento-grid">
          {trips.map(t => {
            const role = t.trip_members?.[0]?.role || 'viewer';
            const tripDates = t.start_date ? `${new Date(t.start_date).toLocaleDateString()} - ${t.end_date ? new Date(t.end_date).toLocaleDateString() : 'TBD'}` : 'Dates TBD';

            return (
              <div key={t.id} className="trip-card">
                <div onClick={() => navigate(`/trips/${t.id}`)} style={{ flex: 1 }}>
                  <div className="trip-card-header">
                    <div>
                      <h3>{t.name}</h3>
                      {t.destination && <p className="trip-dest"><i className="fa-solid fa-location-dot"></i> {t.destination}</p>}
                      <span className={`trip-role ${role}`}>{role}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {role === 'owner' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openInviteModal(t.id); }}
                          className="invite-btn"
                          title="Invite Member"
                        >
                          + Member
                        </button>
                      )}

                      {role === 'owner' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); initiateDelete(t); }}
                          className="delete-btn"
                          title="Delete Trip"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="trip-date">
                    <span>{tripDates}</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box delete-modal">
            <h3>Delete Trip?</h3>
            <p>Are you sure you want to permanently delete <strong>{tripToDelete?.name}</strong>? This action cannot be undone.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
              <button onClick={confirmDelete} style={{ background: '#ff5252' }}>Delete Permanently</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
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

            <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
              <button onClick={handleSendInvite} style={{ background: '#0b5851', color: 'white' }}>Send Invitation</button>
              <button onClick={() => setShowInviteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ TOAST UI */}
      {toast && <div className={`toast ${toast.includes('⚠') || toast.includes('❌') ? 'toast-error' : ''}`}>{toast}</div>}

    </div>
  );
};

export default TripsDashboard;