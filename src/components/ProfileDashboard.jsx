import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/user/profileService';
import { getTravelDNA, upsertTravelDNA } from '../services/user/dnaService';
import { getJournalStats } from '../services/user/journalService';
import { buildPreferenceProfile } from '../services/ai/preferenceService';
import './ProfileDashboard.css';

const ProfileDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const saveTimerRef = useRef(null);

  // Profile State
  const [, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profMsg, setProfMsg] = useState(null);
  const [savingProf, setSavingProf] = useState(false);

  // DNA Form State
  const [dnaLoading, setDnaLoading] = useState(true); // true until first fetch completes
  const [budget, setBudget] = useState('Moderate');
  const [travelStyle, setTravelStyle] = useState('');
  const [interests, setInterests] = useState('');
  const [destinations, setDestinations] = useState('');
  const [dnaMsg, setDnaMsg] = useState(null);
  const [savingDna, setSavingDna] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Journal Stats
  const [journalStats, setJournalStats] = useState({ totalEntries: 0, averageSentiment: 0.5, mood: 'neutral' });

  // Preference profile — always derived live from the form fields
  const preferenceProfile = useMemo(() => {
    const liveDna = {
      budget,
      travel_style: travelStyle,
      interests: interests.split(',').map(s => s.trim()).filter(Boolean),
      preferred_destinations: destinations.split(',').map(s => s.trim()).filter(Boolean),
    };
    return buildPreferenceProfile(liveDna);
  }, [budget, travelStyle, interests, destinations]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      if (!user) {
        setDnaLoading(false);
        return;
      }

      // ── Step 1: read from localStorage INSTANTLY (no network, no spinner) ──
      const cacheKey = `tourweave_dna_${user.id}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const c = JSON.parse(cached);
          setBudget(c.budget || 'Moderate');
          setTravelStyle(c.travel_style || '');
          setInterests((c.interests || []).join(', '));
          setDestinations((c.preferred_destinations || []).join(', '));
          setDnaLoading(false); // ← spinner gone instantly on revisits
        }
      } catch { /* ignore parse errors */ }

      // ── Step 2: silently fetch fresh data from Supabase in background ──
      try {
        const { dna: dData, error: dnaError } = await getTravelDNA(user.id);
        if (dnaError) {
          console.error('getTravelDNA error:', dnaError);
        } else if (dData) {
          setBudget(dData.budget || 'Moderate');
          setTravelStyle(dData.travel_style || '');
          setInterests((dData.interests || []).join(', '));
          setDestinations((dData.preferred_destinations || []).join(', '));
          localStorage.setItem(cacheKey, JSON.stringify(dData)); // keep cache fresh
        }
      } catch (e) {
        console.error('DNA fetch error:', e);
      } finally {
        setDnaLoading(false); // in case there was no cache (first-ever visit)
      }

      // ── Step 3: profile + stats in background ──
      try {
        const { profile: pData } = await getProfile(user.id);
        if (pData) {
          setProfile(pData);
          setDisplayName(pData.display_name || '');
          setBio(pData.bio || '');
          setLocation(pData.location || '');
        }
        const statsResult = await getJournalStats(user.id);
        if (statsResult.success) setJournalStats(statsResult.data);
      } catch (e) {
        console.error('Profile/stats load error:', e);
      }
    };

    loadData();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProf(true);
    setProfMsg(null);
    const { error } = await updateProfile(user.id, { display_name: displayName, bio, location });
    if (error) setProfMsg({ type: 'error', text: error.message });
    else setProfMsg({ type: 'success', text: 'Identity Profile permanently saved.' });
    setSavingProf(false);
  };

  const handleSaveDNA = async () => {
    if (!user?.id) {
      setDnaMsg({ type: 'error', text: 'Not logged in. Please sign in.' });
      return;
    }

    setSavingDna(true);
    setSaveSuccess(false);
    setDnaMsg(null);

    try {
      const intArr = interests.split(',').map(s => s.trim()).filter(Boolean);
      const destArr = destinations.split(',').map(s => s.trim()).filter(Boolean);

      const { error } = await upsertTravelDNA(user.id, {
        budget,
        travel_style: travelStyle,
        interests: intArr,
        preferred_destinations: destArr,
      });

      if (error) {
        setDnaMsg({ type: 'error', text: `Save failed: ${error.message}` });
      } else {
        // Update localStorage cache immediately on save
        const intArr2 = interests.split(',').map(s => s.trim()).filter(Boolean);
        const destArr2 = destinations.split(',').map(s => s.trim()).filter(Boolean);
        localStorage.setItem(`tourweave_dna_${user.id}`, JSON.stringify({
          budget, travel_style: travelStyle, interests: intArr2, preferred_destinations: destArr2
        }));
        setSaveSuccess(true);
        setDnaMsg({ type: 'success', text: '✅ DNA calibrated and saved successfully.' });
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      console.error('🧬 Unexpected error:', e);
      setDnaMsg({ type: 'error', text: `Unexpected error: ${e.message}` });
    }

    setSavingDna(false);
  };


  return (
    <div className="profile-page-container">
      <div className="profile-overlay"></div>

      <div className="profile-wrapper">
        {/* NAV */}
        <nav className="profile-nav">
          <div className="profile-logo" onClick={() => navigate('/')}>TourWeave</div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span onClick={() => navigate('/trips')} className="nav-text-link">My Trips</span>
            <span onClick={() => navigate('/journal')} className="nav-text-link">Journal</span>
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
          </div>
        </nav>

        {/* 2×2 GRID */}
        <div className="profile-grid">

          {/* ── ROW 1, COL 1 — IDENTITY ── */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Aesthetic Identity</h2>
              <p>Configure outward-facing representations of your traveler persona.</p>
            </div>
            <div className="pro-group">
              <label>Email</label>
              <input type="text" className="pro-input" value={user?.email || ''} disabled
                style={{ background: '#eee', color: '#888', cursor: 'not-allowed' }} />
            </div>
            <div className="pro-group">
              <label>Name</label>
              <input type="text" className="pro-input" value={displayName}
                onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Marco Polo" />
            </div>
            <div className="pro-group">
              <label>Origin Location</label>
              <input type="text" className="pro-input" value={location}
                onChange={e => setLocation(e.target.value)} placeholder="e.g. New Delhi, India" />
            </div>
            <div className="pro-group">
              <label>Adventurer Bio</label>
              <textarea className="pro-input pro-textarea" value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell the community what drives your wanderlust..." />
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profMsg && <div className={`pro-msg ${profMsg.type}`} style={{ margin: 0 }}>{profMsg.text}</div>}
              <button className="pro-save-btn" onClick={handleSaveProfile} disabled={savingProf} style={{ margin: 0 }}>
                {savingProf ? 'Solidifying...' : 'Commit Identity'}
              </button>
            </div>
          </div>

          {/* ── ROW 1, COL 2 — JOURNAL STATS ── */}
          <div className="profile-card journal-card">
            <div className="card-header">
              <h2>Memory Journal</h2>
              <p>Track your travel memories and emotional journey.</p>
            </div>
            <div className="journal-stats">
              <div className="stat-item">
                <div className="stat-label">Total Entries</div>
                <div className="stat-value">{journalStats.totalEntries}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Average Mood</div>
                <div className="stat-value" style={{
                  color: journalStats.mood === 'positive' ? '#10b981'
                    : journalStats.mood === 'negative' ? '#ef4444' : '#f59e0b'
                }}>{journalStats.mood}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Positivity Score</div>
                <div className="stat-value">{Math.round(journalStats.averageSentiment * 100)}%</div>
              </div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <button className="pro-save-btn" onClick={() => navigate('/journal')}
                style={{ background: '#1b803a', margin: 0 }}>Open Journal</button>
            </div>
          </div>

          {/* ── ROW 2, COL 1 — TRAVEL DNA ENGINE ── */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Travel DNA Engine</h2>
              <p>Inject your precise preferences. The AI engine uses these to curate perfect routes.</p>
            </div>
            <div className="pro-group">
              <label>Trip Budget Tier</label>
              <select className="pro-select" value={budget} onChange={e => setBudget(e.target.value)}>
                <option value="Budget">Budget / Backpacker</option>
                <option value="Moderate">Moderate / Standard</option>
                <option value="Luxury">Luxury / Premium</option>
              </select>
            </div>
            <div className="pro-group">
              <label>Primary Travel Style</label>
              <select className="pro-select" value={travelStyle} onChange={e => setTravelStyle(e.target.value)}>
                <option value="">(Undefined)</option>
                <option value="Adventure">Adventure / Adrenaline</option>
                <option value="Relaxation">Relaxation / Beach</option>
                <option value="Cultural">Cultural / Heritage</option>
                <option value="Urban">Urban / City Exploring</option>
                <option value="Nature">Nature / Wildlife</option>
              </select>
            </div>
            <div className="pro-group">
              <label>Core Interests (Comma Separated)</label>
              <input type="text" className="pro-input" value={interests}
                onChange={e => setInterests(e.target.value)}
                placeholder="e.g. Hiking, Museums, Fine Dining, Architecture" />
            </div>
            <div className="pro-group">
              <label>Dream Destinations (Comma Separated)</label>
              <input type="text" className="pro-input" value={destinations}
                onChange={e => setDestinations(e.target.value)}
                placeholder="e.g. Goa, Kerala, Kashmir" />
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dnaMsg && <div className={`pro-msg ${dnaMsg.type}`} style={{ margin: 0 }}>{dnaMsg.text}</div>}
              <button
                className={`pro-save-btn dna-save-btn${saveSuccess ? ' dna-save-success' : ''}`}
                onClick={handleSaveDNA}
                disabled={savingDna}
                style={{ margin: 0, position: 'relative', overflow: 'hidden' }}
              >
                {savingDna ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    <span className="btn-spinner" /> Saving...
                  </span>
                ) : saveSuccess ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    ✓ Saved!
                  </span>
                ) : 'Save DNA Matrix'}
              </button>
            </div>
          </div>

          {/* ── ROW 2, COL 2 — LIVE PREFERENCE PROFILE (Glassmorphism) ── */}
          <div className="profile-card pref-glass-card">
            <div className="pref-card-header-row">
              <div>
                <h2 className="pref-glass-title">Preference Profile</h2>
                <p className="pref-glass-sub">Live AI-matched view of your travel personality.</p>
              </div>
              {!dnaLoading && preferenceProfile && (
                <div className="pref-completeness-badge">
                  <span className="pref-badge-pct">{preferenceProfile.completenessScore}%</span>
                  <span className="pref-badge-label">DNA Match</span>
                </div>
              )}
            </div>

            {dnaLoading ? (
              <div className="pref-loading-state">
                <div className="pref-loading-spinner" />
                <p>Loading your preference profile…</p>
              </div>
            ) : preferenceProfile ? (
              <>
                {/* Personality Hero */}
                <div className="pref-hero-banner">
                  <span className="pref-hero-emoji">{preferenceProfile.personality.emoji}</span>
                  <div className="pref-hero-text">
                    <div className="pref-hero-name">{preferenceProfile.personality.title}</div>
                    <div className="pref-hero-tagline">{preferenceProfile.personality.subtitle}</div>
                  </div>
                  <div className="pref-hero-chips">
                    <span className="pref-meta-chip">
                      {preferenceProfile.budgetMeta.emoji} {preferenceProfile.budget}
                    </span>
                    {preferenceProfile.styleMeta && (
                      <span className="pref-meta-chip">
                        {preferenceProfile.styleMeta.emoji} {preferenceProfile.style}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data Blocks */}
                <div className="pref-blocks">
                  <div className="pref-data-block">
                    <div className="pref-block-label">BUDGET TIER</div>
                    <div className="pref-block-value">{preferenceProfile.budgetMeta.emoji} {preferenceProfile.budgetMeta.label}</div>
                    <div className="pref-block-desc">{preferenceProfile.budgetMeta.description}</div>
                  </div>

                  <div className="pref-data-block">
                    <div className="pref-block-label">TRAVEL STYLE</div>
                    {preferenceProfile.styleMeta ? (
                      <>
                        <div className="pref-block-value">{preferenceProfile.styleMeta.emoji} {preferenceProfile.style}</div>
                        <div className="pref-trait-pills">
                          {preferenceProfile.styleMeta.traits.map(t => (
                            <span key={t} className="pref-trait-pill">{t}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="pref-block-empty">Choose a style ←</div>
                    )}
                  </div>

                  <div className="pref-data-block pref-block-wide">
                    <div className="pref-block-label">INTERESTS</div>
                    {preferenceProfile.taggedInterests.length > 0 ? (
                      <div className="pref-interest-pills">
                        {preferenceProfile.taggedInterests.map((tag, i) => (
                          <span key={i} className="pref-interest-pill">{tag.text}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="pref-block-empty">Type your interests ←</div>
                    )}
                  </div>

                  <div className="pref-data-block pref-block-wide">
                    <div className="pref-block-label">AI-MATCHED DESTINATIONS</div>
                    {preferenceProfile.styleMeta?.destinations ? (
                      <div className="pref-dest-pills">
                        {preferenceProfile.styleMeta.destinations.map(dest => (
                          <span key={dest} className="pref-dest-pill">📍 {dest}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="pref-block-empty">Set a travel style to unlock ←</div>
                    )}
                  </div>
                </div>

                {/* Completeness Bar */}
                <div className="pref-completeness-bar-section">
                  <div className="pref-completeness-bar-header">
                    <span className="pref-bar-title">DNA Completeness</span>
                    <span className="pref-bar-pct">{preferenceProfile.completenessScore}%</span>
                  </div>
                  <div className="pref-progress-track">
                    <div className="pref-progress-fill" style={{ width: `${preferenceProfile.completenessScore}%` }} />
                  </div>
                  <div className="pref-bar-hint">
                    {preferenceProfile.completenessScore < 55 && '→ Choose a Travel Style to unlock insights.'}
                    {preferenceProfile.completenessScore >= 55 && preferenceProfile.completenessScore < 80 && '→ Add Core Interests for smarter matches.'}
                    {preferenceProfile.completenessScore >= 80 && preferenceProfile.completenessScore < 100 && '→ Add Dream Destinations to complete.'}
                    {preferenceProfile.completenessScore === 100 && '✅ Fully calibrated — AI recommendations at maximum.'}
                  </div>
                </div>
              </>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
