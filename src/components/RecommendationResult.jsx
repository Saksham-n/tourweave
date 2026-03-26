import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateRecommendations } from '../services/ai/recommendationService';
import './RecommendationResult.css';

const icons = [
  'fa-solid fa-mountain-sun',
  'fa-solid fa-tree',
  'fa-solid fa-water',
  'fa-solid fa-camera-retro',
  'fa-solid fa-campground',
  'fa-solid fa-archway'
];

const RecommendationResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract query parameters
  const searchParams = new URLSearchParams(location.search);
  const dest = searchParams.get('dest') || 'India';
  const interest = searchParams.get('interest') || 'Heritage';
  const type = searchParams.get('type') || 'Hill Side';

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setErrorMsg('');
        const results = await generateRecommendations({ destination: dest, interest, type });
        setRecommendations(results);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to generate recommendations. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [dest, interest, type]);

  return (
    <div className="recommendation-container">
      <div className="recommendation-overlay"></div>
      
      <div className="rec-wrapper">
        <nav className="rec-nav">
          <div className="logo" onClick={() => navigate('/')}>TourWeave</div>
          <button className="back-btn" onClick={() => navigate('/')}>&larr; Back to Home</button>
        </nav>

        <section className="rec-hero">
          <h1>Your Curated Escapes</h1>
          <p>We've analyzed terrain data, cultural artifacts, and scenic routes to find the perfect matches for your unique travel DNA.</p>
          <div className="rec-tags">
            <div className="rec-tag"><i className="fa-solid fa-location-dot"></i> {dest}</div>
            <div className="rec-tag"><i className="fa-solid fa-heart"></i> {interest}</div>
            <div className="rec-tag"><i className="fa-solid fa-layer-group"></i> {type}</div>
          </div>
        </section>

        {isLoading ? (
          <div className="rec-loader">
            <div className="rec-spinner"></div>
            <h3>Synthesizing Destinations...</h3>
            <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Mapping the perfect {interest.toLowerCase()} locations near {dest}.</p>
          </div>
        ) : errorMsg ? (
          <div className="rec-loader">
             <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: '#fca5a5', marginBottom: '1rem' }}></i>
             <h3 style={{ color: '#fca5a5' }}>Generation Interrupted</h3>
             <p>{errorMsg}</p>
          </div>
        ) : (
          <div className="rec-grid">
            {recommendations.map((rec, index) => (
              <div className="rec-card" key={index}>
                <div className="rec-card-icon">
                  <i className={icons[index % icons.length]}></i>
                </div>
                <h3>{rec.name}</h3>
                <p>{rec.description}</p>
                <div className="rec-highlight">
                  <i className="fa-solid fa-star"></i> {rec.highlight}
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="rec-guide">
          <h2>Bring Your Plan to Life</h2>
          <p>TourWeave goes beyond recommendations. Once you've chosen your destination, leverage our AI suite to fully architect your trip from start to finish.</p>
          
          <div className="guide-features">
            <div className="guide-feature">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <h4>AI Trip Planner</h4>
              <p>Generate precise day-by-day itineraries tailored to your budget and travel style.</p>
            </div>
            <div className="guide-feature">
              <i className="fa-solid fa-users"></i>
              <h4>Collaborative Canvas</h4>
              <p>Invite friends and co-plan your adventure with real-time shared trip boards.</p>
            </div>
            <div className="guide-feature">
              <i className="fa-solid fa-book-journal-whills"></i>
              <h4>Travel Journal</h4>
              <p>Document memories and let our AI analyze your travel patterns over time.</p>
            </div>
          </div>
        </section>

        <div className="rec-actions">
           <button className="rec-btn-primary" onClick={() => navigate('/trips')}>
             Create a Trip <i className="fa-solid fa-arrow-right" style={{ marginLeft: '10px' }}></i>
           </button>
           <button className="rec-btn-secondary" onClick={() => navigate('/')}>
             Explore More
           </button>
        </div>

      </div>
    </div>
  );
};

export default RecommendationResult;
