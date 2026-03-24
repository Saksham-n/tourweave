import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTrip, getUserTrips, deleteTrip } from '../services/user/tripService';
import { getTravelDNA } from '../services/user/dnaService';
import { generateItinerary, saveItinerary, getItinerary } from '../services/ai/itineraryService';
import ItineraryView from './ItineraryView';
import './TripsDashboard.css';

const TripsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Itinerary states
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [itineraries, setItineraries] = useState({}); // { tripId: data }
  const [itinForm, setItinForm] = useState({ destination: '', days: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinError, setItinError] = useState('');

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
      setErrorMsg('Your trip needs a name before we can continue!');
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

  const handleExpandTrip = async (tripId) => {
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      return;
    }
    setExpandedTripId(tripId);
    setItinError('');
    setItinForm({ destination: '', days: '' });
    
    if (!itineraries[tripId]) {
      const { data } = await getItinerary(tripId);
      if (data) {
        setItineraries(prev => ({ ...prev, [tripId]: data }));
      }
    }
  };

  const handleGenerateItinerary = async (tripId) => {
    if (!itinForm.destination.trim() || !itinForm.days) {
      setItinError('Please enter both destination and number of days.');
      return;
    }
    
    setIsGenerating(true);
    setItinError('');

    try {
      // 1. Fetch user's Travel DNA to personalize local generation
      const { dna } = await getTravelDNA(user.id);
      
      // 2. Generate via AI
      const generatedJson = await generateItinerary({
        destination: itinForm.destination,
        days: parseInt(itinForm.days, 10),
        budget: dna?.budget || 'Moderate',
        travelStyle: dna?.travel_style || 'General',
        interests: dna?.interests || []
      });

      // 3. Save to Supabase
      const { data: savedData, error: saveErr } = await saveItinerary(tripId, user.id, generatedJson);
      if (saveErr) throw new Error(`Save failed: ${saveErr.message}`);

      // 4. Update UI
      setItineraries(prev => ({ ...prev, [tripId]: savedData }));
      setItinForm({ destination: '', days: '' });

    } catch (err) {
      console.error(err);
      setItinError(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setIsGenerating(false);
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
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
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
            {errorMsg}
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
                <div key={t.id} className={`trip-card ${expandedTripId === t.id ? 'expanded' : ''}`} onClick={() => handleExpandTrip(t.id)} style={{ cursor: 'pointer' }}>
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
                    <i className={`fa-solid fa-chevron-${expandedTripId === t.id ? 'up' : 'down'}`}></i>
                  </div>

                  {expandedTripId === t.id && (
                    <div className="trip-itinerary-section" onClick={(e) => e.stopPropagation()} style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', cursor: 'default' }}>
                      
                      {itineraries[t.id] ? (
                        <>
                          <ItineraryView itineraryData={itineraries[t.id]} />
                          <button 
                            className="itin-gen-btn" 
                            style={{marginTop: '1rem', background: 'transparent', border: '1px solid #a7f3d0', color: '#a7f3d0', padding: '0.4rem 0.8rem', fontSize:'0.9rem'}}
                            onClick={() => {
                              if(window.confirm('This will permanently overwrite the current plan. Regenerate?')) {
                                setItineraries(prev => ({...prev, [t.id]: null})); // Clear to show form
                              }
                            }}
                          >
                            <i className="fa-solid fa-rotate-right"></i> Regenerate New Plan
                          </button>
                        </>
                      ) : (
                        <div className="itin-gen-form">
                          <h4 style={{ margin: 0, color: '#0b5851', fontSize: '1.2rem' }}>AI Itinerary Studio</h4>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                            We'll use your Travel DNA to hyper-personalize this plan.
                          </p>
                          
                          <div className="itin-form-row">
                            <label>Destination (City or State)</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Kerala, Jaipur, Goa" 
                              value={itinForm.destination}
                              onChange={e => setItinForm({...itinForm, destination: e.target.value})}
                              disabled={isGenerating}
                            />
                          </div>
                          
                          <div className="itin-form-row">
                            <label>Number of Days</label>
                            <input 
                              type="number" 
                              min="1" max="14"
                              placeholder="e.g. 5" 
                              value={itinForm.days}
                              onChange={e => setItinForm({...itinForm, days: e.target.value})}
                              disabled={isGenerating}
                            />
                          </div>
                          
                          {itinError && <div className="itin-error">{itinError}</div>}
                          
                          <button 
                            className="itin-gen-btn" 
                            onClick={() => handleGenerateItinerary(t.id)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <><span className="itin-gen-spinner"></span> Synthesizing AI Matrix...</>
                            ) : (
                              <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate Itinerary</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
