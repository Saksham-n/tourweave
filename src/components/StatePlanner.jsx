import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateItinerary } from '../services/ai/itineraryService';
import ItineraryView from './ItineraryView';
import './StatePlanner.css';

const StatePlanner = () => {
  const { stateId } = useParams();
  const navigate = useNavigate();

  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState('Moderate');
  const [style, setStyle] = useState('Cultural / Heritage');
  const [interests, setInterests] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const formattedState = stateId ? decodeURIComponent(stateId) : 'Madhya Pradesh';

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setItinerary(null);
    setErrorMsg('');

    try {
      // Convert interests string to array
      const interestArr = interests.split(',').map(s => s.trim()).filter(Boolean);

      const result = await generateItinerary({
        destination: formattedState,
        days: parseInt(days),
        budget,
        travelStyle: style,
        interests: interestArr
      });
      setItinerary(result);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="state-planner-container">
      <div className="planner-overlay"></div>
      
      <div className="planner-wrapper">
        <nav className="profile-nav" style={{ padding: '1.5rem 5%' }}>
          <div className="profile-logo" onClick={() => navigate('/')}>TourWeave</div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
             <button className="profile-back-btn" onClick={() => navigate(-1)}>&larr; Back</button>
          </div>
        </nav>

        <div className="planner-hero-text">
          <h1>{formattedState} AI Planner</h1>
          <p>Instantly architect a hyper-personalized journey through {formattedState}.</p>
        </div>

        <div className="planner-grid">
          
          {/* Left Column: Form */}
          <div className="planner-form-card">
            <h2>Journey Constraints</h2>
            <form onSubmit={handleGenerate}>
              <div className="planner-group">
                <label>Number of Days</label>
                <select className="planner-select" value={days} onChange={e => setDays(e.target.value)}>
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(d => (
                    <option key={d} value={d}>{d} {d === 1 ? 'Day' : 'Days'}</option>
                  ))}
                </select>
              </div>

              <div className="planner-group">
                <label>Budget Tier</label>
                <select className="planner-select" value={budget} onChange={e => setBudget(e.target.value)}>
                  <option value="Budget">Budget / Backpacker (₹)</option>
                  <option value="Moderate">Moderate / Standard (₹₹)</option>
                  <option value="Luxury">Luxury / Premium (₹₹₹)</option>
                </select>
              </div>

              <div className="planner-group">
                <label>Travel Style</label>
                <select className="planner-select" value={style} onChange={e => setStyle(e.target.value)}>
                  <option value="Cultural / Heritage">Cultural / Heritage 🏛️</option>
                  <option value="Adventure / Adrenaline">Adventure / Adrenaline 🏔️</option>
                  <option value="Nature / Wildlife">Nature / Wildlife 🌿</option>
                  <option value="Relaxation / Beaches">Relaxation / Beach 🌊</option>
                  <option value="Urban / City Exploration">Urban / City 🏙️</option>
                  <option value="Spiritual / Pilgrimage">Spiritual / Pilgrimage 🕉️</option>
                </select>
              </div>

              <div className="planner-group">
                <label>Specific Interests (Optional)</label>
                <input 
                  type="text" 
                  className="planner-input" 
                  placeholder="e.g. Street food, Photography, Temples"
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                />
              </div>

              <button type="submit" className="planner-btn" disabled={isGenerating}>
                {isGenerating ? 'Synthesizing Routes...' : 'Generate Itinerary'}
              </button>
            </form>
          </div>

          {/* Right Column: Results */}
          <div className="planner-result-card">
             {isGenerating ? (
               <div className="planner-loading">
                 <div className="planner-spinner"></div>
                 <h3>Consulting Neural Networks...</h3>
                 <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>Mapping trails across {formattedState} according to your constraints.</p>
               </div>
             ) : errorMsg ? (
               <div className="planner-loading">
                 <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: '#fca5a5', marginBottom: '1rem' }}></i>
                 <h3 style={{ color: '#fca5a5' }}>Generation Failed</h3>
                 <p>{errorMsg}</p>
               </div>
             ) : itinerary ? (
               <ItineraryView itineraryData={itinerary} />
             ) : (
               <div className="planner-empty-state">
                 <i className="fa-solid fa-map-location-dot"></i>
                 <h3>Ready to Explore</h3>
                 <p>Adjust your parameters on the left and hit generate to chart your course.</p>
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatePlanner;
