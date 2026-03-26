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

  const [isDaysOpen, setIsDaysOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false);

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
                <div className={`custom-select ${isDaysOpen ? 'active' : ''}`}>
                  <div className="dropdown-trigger" onClick={() => { setIsDaysOpen(!isDaysOpen); setIsBudgetOpen(false); setIsStyleOpen(false); }}>
                    <span>{days} {parseInt(days) === 1 ? 'Day' : 'Days'}</span>
                    <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <div className="dropdown-content">
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(d => (
                      <div key={d} className="dropdown-option" onClick={() => { setDays(d); setIsDaysOpen(false); }}>
                        {d} {d === 1 ? 'Day' : 'Days'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="planner-group">
                <label>Budget Tier</label>
                <div className={`custom-select ${isBudgetOpen ? 'active' : ''}`}>
                  <div className="dropdown-trigger" onClick={() => { setIsBudgetOpen(!isBudgetOpen); setIsDaysOpen(false); setIsStyleOpen(false); }}>
                    <span>{budget === 'Budget' ? 'Budget / Backpacker (₹)' : budget === 'Moderate' ? 'Moderate / Standard (₹₹)' : 'Luxury / Premium (₹₹₹)'}</span>
                    <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <div className="dropdown-content">
                    <div className="dropdown-option" onClick={() => { setBudget('Budget'); setIsBudgetOpen(false); }}>Budget / Backpacker (₹)</div>
                    <div className="dropdown-option" onClick={() => { setBudget('Moderate'); setIsBudgetOpen(false); }}>Moderate / Standard (₹₹)</div>
                    <div className="dropdown-option" onClick={() => { setBudget('Luxury'); setIsBudgetOpen(false); }}>Luxury / Premium (₹₹₹)</div>
                  </div>
                </div>
              </div>

              <div className="planner-group">
                <label>Travel Style</label>
                <div className={`custom-select ${isStyleOpen ? 'active' : ''}`}>
                  <div className="dropdown-trigger" onClick={() => { setIsStyleOpen(!isStyleOpen); setIsDaysOpen(false); setIsBudgetOpen(false); }}>
                    <span>{style === 'Urban / City Exploration' ? 'Urban / City' : style === 'Relaxation / Beaches' ? 'Relaxation / Beach' : style}</span>
                    <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <div className="dropdown-content">
                    {[
                      { val: 'Cultural / Heritage', label: 'Cultural / Heritage' },
                      { val: 'Adventure / Adrenaline', label: 'Adventure / Adrenaline' },
                      { val: 'Nature / Wildlife', label: 'Nature / Wildlife' },
                      { val: 'Relaxation / Beaches', label: 'Relaxation / Beach' },
                      { val: 'Urban / City Exploration', label: 'Urban / City' },
                      { val: 'Spiritual / Pilgrimage', label: 'Spiritual / Pilgrimage' }
                    ].map(opt => (
                      <div key={opt.val} className="dropdown-option" onClick={() => { setStyle(opt.val); setIsStyleOpen(false); }}>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </div>
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
