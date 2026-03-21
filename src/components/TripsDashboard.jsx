import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTrip, getUserTrips, deleteTrip } from '../services/user/tripService';
import './TripsDashboard.css';

const TripsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTrips = async () => {
    if (!user) return;
    const { trips } = await getUserTrips(user.id);
    if (trips) setTrips(trips);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchTrips();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSpawnTrip = async () => {
    if (!newTripName.trim()) {
      setErrorMsg('Trip name cannot be empty!');
      return;
    }
    
    setIsSpawning(true);
    setErrorMsg('');
    
    const { error } = await createTrip(user.id, newTripName);
    
    if (error) {
      setErrorMsg(error.message);
    } else {
      setNewTripName('');
      await fetchTrips(); // Refresh the grid directly from Postgres
    }
    
    setIsSpawning(false);
  };

  const handleDeleteTrip = async (tripId, tripName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${tripName}"?`)) return;
    
    const { error } = await deleteTrip(tripId);
    if (error) {
      setErrorMsg(`Failed to delete: ${error.message}`);
    } else {
      await fetchTrips();
    }
  };

  return (
    <div className="trips-page-container">
      <div className="trips-overlay"></div>
      
      <div className="trips-wrapper">
        <nav className="profile-nav" style={{ padding: '1.5rem 5%' }}>
          <div className="profile-logo" onClick={() => navigate('/')}>TourWeave</div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span 
              onClick={() => navigate('/profile')} 
              style={{ color: 'white', cursor: 'pointer', fontWeight: 600, borderBottom: '1px solid transparent', paddingBottom: '2px', transition: '0.3s' }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'white'}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              My Profile
            </span>
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Return to Application</button>
          </div>
        </nav>

        <div className="trips-hero-text">
          <h1>Collaborative Trips</h1>
          <p>Instantiate a new journey and invite travelers. Backed by PostgreSQL Relational Architecture.</p>
        </div>

        <div className="trip-spawner">
          <input 
            type="text" 
            placeholder="e.g. Himalayas 2026, Monsoon Getaway..." 
            value={newTripName} 
            onChange={e => { setNewTripName(e.target.value); setErrorMsg(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSpawnTrip()}
          />
          <button onClick={handleSpawnTrip} disabled={isSpawning}>
            {isSpawning ? 'Spawning...' : 'Create Trip'}
          </button>
        </div>
        
        {errorMsg && (
          <div style={{ color: '#ffcdd2', background: 'rgba(198,40,40,0.8)', padding: '1rem', borderRadius: '12px', textAlign: 'center', margin: '-3rem auto 3rem auto', maxWidth: '600px', backdropFilter: 'blur(5px)' }}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        <div className="trips-bento-grid">
          {trips.length === 0 ? (
            <div className="empty-trips">
              <h2>No Trips Found</h2>
              <p>You haven't spawned or joined any collaborative journeys yet.</p>
            </div>
          ) : (
            trips.map(t => {
              const userRole = t.trip_members[0]?.role || 'viewer';
              const dateString = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <div key={t.id} className="trip-card">
                  <div className="trip-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3>{t.name}</h3>
                      <span className={`trip-role ${userRole}`}>{userRole}</span>
                    </div>
                    {userRole === 'owner' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTrip(t.id, t.name); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff5252', fontSize: '1.2rem', padding: '5px' }}
                        title="Delete Trip"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                  <div className="trip-date">
                    <span>Constructed: {dateString}</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default TripsDashboard;
