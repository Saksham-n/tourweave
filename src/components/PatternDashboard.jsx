import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aggregateUserTravelData, generatePatternReport } from '../services/ai/patternAnalysisService';
import './PatternDashboard.css';

const PatternDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [report, setReport] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchAndAnalyze = async (forceRefresh = false) => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Check cache first to avoid burning OpenRouter tokens on every refresh
      const cacheKey = `tw_pattern_${user.id}`;
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Expire cache after 24 hours
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setReport(parsed.report);
            setStats(parsed.stats);
            setIsLoading(false);
            return;
          }
        }
      }

      // Step 1: Gather Stats
      const data = await aggregateUserTravelData(user.id);
      setStats(data);

      if (!data.hasEnoughData) {
        setIsLoading(false);
        return; // Empty state
      }

      // Step 2: Generate AI Analysis
      const aiReport = await generatePatternReport(data);
      setReport(aiReport);

      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        report: aiReport,
        stats: data
      }));

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze patterns.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAndAnalyze();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="pattern-page-container">
      <div className="pattern-overlay"></div>
      
      <div className="pattern-wrapper">
        <nav className="profile-nav" style={{ padding: '1.5rem 5%' }}>
          <div className="profile-logo" onClick={() => navigate('/')}>TourWeave</div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span 
              onClick={() => navigate('/trips')} 
              style={{ color: 'white', cursor: 'pointer', fontWeight: 600, borderBottom: '1px solid transparent', paddingBottom: '2px', transition: '0.3s' }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'white'}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              My Trips
            </span>
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
          </div>
        </nav>

        <div className="pattern-hero-text">
          <h1>Behavioral Analysis</h1>
          <p>The Matrix of your travels. We crossed your historical trips, mood journal, and DNA to understand the traveler you truly are.</p>
        </div>

        {isLoading ? (
          <div className="pattern-center-message">
            <div className="pattern-spinner"></div>
            <h3>Synthesizing Travel History...</h3>
            <p style={{ opacity: 0.7 }}>Querying the neural pathways of your adventures.</p>
          </div>
        ) : errorMsg ? (
          <div className="pattern-center-message">
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: '#fca5a5', marginBottom: '1rem' }}></i>
            <h3>Analysis Errored</h3>
            <p style={{ color: '#fca5a5' }}>{errorMsg}</p>
            <button className="refresh-analysis-btn" onClick={() => fetchAndAnalyze(true)}>Retry Connection</button>
          </div>
        ) : !stats?.hasEnoughData ? (
          <div className="pattern-center-message">
            <i className="fa-solid fa-ghost" style={{ fontSize: '4rem', color: '#a7f3d0', opacity: 0.5, marginBottom: '1rem' }}></i>
            <h2>Not Enough Data Yet</h2>
            <p style={{ maxWidth: '400px', lineHeight: 1.6, marginTop: '1rem', color: '#cbd5e1' }}>
              We need a bit more history to accurately map your travel personality. 
              Try planning a new Trip or adding an entry to your Travel Journal!
            </p>
            <button className="pill-btn orange" style={{ marginTop: '2rem' }} onClick={() => navigate('/trips')}>
              Start a Journey
            </button>
          </div>
        ) : (
          <div className="pattern-bento-grid">
            
            {/* Personality Card */}
            <div className="pattern-card full-width">
              <div className="personality-title">Your AI-Assigned Identity</div>
              <h2 className="personality-name">{report?.personalityType || "The Drifter"}</h2>
            </div>

            {/* Narrative Card */}
            <div className="pattern-card">
              <h3><i className="fa-solid fa-scroll"></i> The Narrative</h3>
              <div className="pattern-narrative">
                {report?.narrative}
              </div>
            </div>

            {/* Insights Card */}
            <div className="pattern-card">
              <h3><i className="fa-solid fa-lightbulb"></i> Core Insights</h3>
              <ul className="pattern-insights">
                {report?.insights?.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                )) || <li>No insights could be drawn.</li>}
              </ul>
            </div>

            {/* By The Numbers */}
            <div className="pattern-card full-width">
              <h3 style={{ justifyContent: 'center' }}><i className="fa-solid fa-chart-line"></i> By The Numbers</h3>
              <div className="stats-grid" style={{ maxWidth: '800px', margin: '0 auto', marginTop: '2rem' }}>
                <div className="stat-box">
                  <i className="fa-solid fa-map-location-dot"></i>
                  <div className="stat-value">{stats?.totalTrips || 0}</div>
                  <div className="stat-label">Journeys Instantiated</div>
                </div>
                <div className="stat-box">
                  <i className="fa-solid fa-book-journal-whills"></i>
                  <div className="stat-value">{stats?.totalJournalEntries || 0}</div>
                  <div className="stat-label">Memories Logged</div>
                </div>
                <div className="stat-box">
                  <i className="fa-solid fa-dna"></i>
                  <div className="stat-value">{stats?.dnaUpdatesCount || 0}</div>
                  <div className="stat-label">DNA Paradigm Shifts</div>
                </div>
                <div className="stat-box">
                  <i className="fa-solid fa-face-smile"></i>
                  <div className="stat-value">{stats?.averageSentiment || 'N/A'}</div>
                  <div className="stat-label">Avg Sentiment (1-5)</div>
                </div>
              </div>
              
              <button 
                className="refresh-analysis-btn" 
                onClick={() => {
                  if(window.confirm('This will trigger a new AI analysis computation. Proceed?')) {
                    fetchAndAnalyze(true);
                  }
                }}
              >
                <i className="fa-solid fa-rotate"></i> Recalculate Matrix
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default PatternDashboard;
