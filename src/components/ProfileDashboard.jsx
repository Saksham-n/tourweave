import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/user/profileService';
import { getTravelDNA, upsertTravelDNA } from '../services/user/dnaService';
import { getJournalStats } from '../services/user/journalService';
import ExpenseModule from './expense/ExpenseModule';
import './ProfileDashboard.css';

const ProfileDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile State
  const [, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profMsg, setProfMsg] = useState(null);
  const [savingProf, setSavingProf] = useState(false);

  // DNA State
  const [, setDna] = useState(null);
  const [budget, setBudget] = useState('Moderate');
  const [travelStyle, setTravelStyle] = useState('');
  const [interests, setInterests] = useState('');
  const [destinations, setDestinations] = useState('');
  const [dnaMsg, setDnaMsg] = useState(null);
  const [savingDna, setSavingDna] = useState(false);

  // Journal Stats State
  const [journalStats, setJournalStats] = useState({ totalEntries: 0, averageSentiment: 0.5, mood: 'neutral' });
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    // Escalate to top of page on mount
    window.scrollTo(0, 0);

    // Close dropdowns on outside click
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.pro-custom-select')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);

    const loadData = async () => {
      if (!user) return;
      
      const { profile: pData } = await getProfile(user.id);
      if (pData) {
        setProfile(pData);
        setDisplayName(pData.display_name || '');
        setBio(pData.bio || '');
        setLocation(pData.location || '');
      }

      const { dna: dData } = await getTravelDNA(user.id);
      if (dData) {
        setDna(dData);
        setBudget(dData.budget || 'Moderate');
        setTravelStyle(dData.travel_style || '');
        setInterests((dData.interests || []).join(', '));
        setDestinations((dData.preferred_destinations || []).join(', '));
      }

      // Load journal stats
      const statsResult = await getJournalStats(user.id);
      if (statsResult.success) {
        setJournalStats(statsResult.data);
      }
    };

    loadData();
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProf(true);
    setProfMsg(null);
    const { error } = await updateProfile(user.id, {
      display_name: displayName,
      bio,
      location
    });

    if (error) setProfMsg({ type: 'error', text: error.message });
    else setProfMsg({ type: 'success', text: 'Identity Profile permanently saved.' });
    setSavingProf(false);
  };

  const handleSaveDNA = async () => {
    setSavingDna(true);
    setDnaMsg(null);

    const intArr = interests.split(',').map(s => s.trim()).filter(Boolean);
    const destArr = destinations.split(',').map(s => s.trim()).filter(Boolean);

    const { error } = await upsertTravelDNA(user.id, {
      budget,
      travel_style: travelStyle,
      interests: intArr,
      preferred_destinations: destArr
    });

    if (error) setDnaMsg({ type: 'error', text: error.message });
    else setDnaMsg({ type: 'success', text: 'AI Travel DNA permanently calibrated.' });
    setSavingDna(false);
  };

  return (
    <div className="profile-page-container">
      <style>{`
        /* Refined aesthetic styles */
        .profile-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }
        .profile-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
        }
        .profile-card-span-full {
          grid-column: 1 / -1;
        }
        .card-header h2 {
          font-size: 1.5rem;
          color: #111;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .card-header p {
          font-size: 0.95rem;
          color: #666;
          line-height: 1.5;
          margin-bottom: 1.2rem;
        }
        .pro-group {
          margin-bottom: 1rem;
        }
        .pro-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #555;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pro-input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9fbf9;
          color: #333;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .pro-input:focus {
          outline: none;
          border-color: #1B803A;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(27, 128, 58, 0.1);
        }
        .pro-textarea {
          resize: vertical;
          min-height: 80px;
        }
        .pro-save-btn {
          width: 100%;
          padding: 0.8rem;
          border: none;
          border-radius: 8px;
          background: #111;
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.1s ease;
          margin-top: 1rem;
        }
        .pro-save-btn:hover {
          background: #000;
          transform: translateY(-1px);
        }
        .pro-save-btn:disabled {
          background: #888;
          cursor: not-allowed;
          transform: none;
        }
        .journal-card {
          background: #ffffff !important; 
        }
        .journal-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-item {
          background: #f8faf9;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #eef2f0;
        }
        .stat-label {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111;
        }

        /* Custom Select Styles */
        .pro-custom-select {
            position: relative;
            width: 100%;
            user-select: none;
        }
        .pro-select-trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0.6rem 0.8rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #f9fbf9;
            color: #333;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .pro-custom-select.active .pro-select-trigger,
        .pro-select-trigger:hover {
            border-color: #1B803A;
            background: #fff;
        }
        .pro-custom-select.active .pro-select-trigger {
            box-shadow: 0 0 0 3px rgba(27, 128, 58, 0.1);
        }
        .pro-select-arrow {
            transition: transform 0.3s ease;
            stroke: #666;
        }
        .pro-custom-select.active .pro-select-arrow {
            transform: rotate(180deg);
        }
        .pro-select-dropdown {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            z-index: 100;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
            max-height: 250px;
            overflow-y: auto;
        }
        .pro-custom-select.active .pro-select-dropdown {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        .pro-select-dropdown::-webkit-scrollbar {
            width: 6px;
        }
        .pro-select-dropdown::-webkit-scrollbar-track {
            background: transparent;
        }
        .pro-select-dropdown::-webkit-scrollbar-thumb {
            background-color: #c1c1c1;
            border-radius: 4px;
        }
        .pro-select-option {
            padding: 0.6rem 0.8rem;
            font-size: 0.95rem;
            color: #444;
            cursor: pointer;
            transition: background 0.2s ease, color 0.2s ease;
        }
        .pro-select-option:hover {
            background: #f0f7f2;
            color: #1B803A;
        }
        .pro-select-option.selected {
            background: #e8f5e9;
            color: #1B803A;
            font-weight: 600;
        }
        .pro-custom-select.disabled {
            opacity: 0.6;
            pointer-events: none;
        }
        .expense-participant-avatar, .expense-split-avatar {
            width: 24px;
            height: 24px;
            font-size: 0.6rem;
            margin: 10px;
        }
        .profile-overlay {
            backdrop-filter: none !important;
        }

        @media (max-width: 768px) {
          .journal-stats {
            grid-template-columns: 1fr;
          }
          .profile-card {
            padding: 1.5rem;
          }
        }
      `}</style>
      <div className="profile-overlay"></div>
      
      <div className="profile-wrapper">
        <nav className="profile-nav">
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
            <span 
              onClick={() => navigate('/journal')} 
              style={{ color: 'white', cursor: 'pointer', fontWeight: 600, borderBottom: '1px solid transparent', paddingBottom: '2px', transition: '0.3s' }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'white'}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              Journal
            </span>
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
          </div>
        </nav>

        <div className="profile-grid">

          {/* COLUMN 1: TRAVEL DNA */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Travel DNA Engine</h2>
              <p>Inject your precise preferences into the PostgreSQL system. The AI engine utilizes these metrics to curate perfect routes.</p>
            </div>

            <div className="pro-group">
              <label>Trip Budget Tier</label>
              <div className={`pro-custom-select ${activeDropdown === 'budget' ? 'active' : ''}`}>
                <div className="pro-select-trigger" onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}>
                  <span>{budget === 'Budget' ? 'Budget / Backpacker' : budget === 'Moderate' ? 'Moderate / Standard' : 'Luxury / Premium'}</span>
                  <svg className="pro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div className="pro-select-dropdown">
                  <div className={`pro-select-option ${budget === 'Budget' ? 'selected' : ''}`} onClick={() => { setBudget('Budget'); setActiveDropdown(null); }}>Budget / Backpacker</div>
                  <div className={`pro-select-option ${budget === 'Moderate' ? 'selected' : ''}`} onClick={() => { setBudget('Moderate'); setActiveDropdown(null); }}>Moderate / Standard</div>
                  <div className={`pro-select-option ${budget === 'Luxury' ? 'selected' : ''}`} onClick={() => { setBudget('Luxury'); setActiveDropdown(null); }}>Luxury / Premium</div>
                </div>
              </div>
            </div>

            <div className="pro-group">
              <label>Primary Travel Style</label>
              <div className={`pro-custom-select ${activeDropdown === 'style' ? 'active' : ''}`}>
                <div className="pro-select-trigger" onClick={() => setActiveDropdown(activeDropdown === 'style' ? null : 'style')}>
                  <span>
                    {travelStyle === 'Adventure' ? 'Adventure / Adrenaline' :
                     travelStyle === 'Relaxation' ? 'Relaxation / Beach' :
                     travelStyle === 'Cultural' ? 'Cultural / Heritage' :
                     travelStyle === 'Urban' ? 'Urban / City Exploring' :
                     travelStyle === 'Nature' ? 'Nature / Wildlife' : '(Undefined)'}
                  </span>
                  <svg className="pro-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div className="pro-select-dropdown">
                  <div className={`pro-select-option ${travelStyle === '' ? 'selected' : ''}`} onClick={() => { setTravelStyle(''); setActiveDropdown(null); }}>(Undefined)</div>
                  <div className={`pro-select-option ${travelStyle === 'Adventure' ? 'selected' : ''}`} onClick={() => { setTravelStyle('Adventure'); setActiveDropdown(null); }}>Adventure / Adrenaline</div>
                  <div className={`pro-select-option ${travelStyle === 'Relaxation' ? 'selected' : ''}`} onClick={() => { setTravelStyle('Relaxation'); setActiveDropdown(null); }}>Relaxation / Beach</div>
                  <div className={`pro-select-option ${travelStyle === 'Cultural' ? 'selected' : ''}`} onClick={() => { setTravelStyle('Cultural'); setActiveDropdown(null); }}>Cultural / Heritage</div>
                  <div className={`pro-select-option ${travelStyle === 'Urban' ? 'selected' : ''}`} onClick={() => { setTravelStyle('Urban'); setActiveDropdown(null); }}>Urban / City Exploring</div>
                  <div className={`pro-select-option ${travelStyle === 'Nature' ? 'selected' : ''}`} onClick={() => { setTravelStyle('Nature'); setActiveDropdown(null); }}>Nature / Wildlife</div>
                </div>
              </div>
            </div>

            <div className="pro-group">
              <label>Core Interests (Comma Separated)</label>
              <input type="text" className="pro-input" value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g. Hiking, Museums, Fine Dining, Architecture" />
            </div>

            <div className="pro-group">
              <label>Dream Destinations (Comma Separated)</label>
              <input type="text" className="pro-input" value={destinations} onChange={e => setDestinations(e.target.value)} placeholder="e.g. Japan, Italy, New Zealand" />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dnaMsg && <div className={`pro-msg ${dnaMsg.type}`} style={{ margin: 0 }}>{dnaMsg.text}</div>}
              <button className="pro-save-btn" onClick={handleSaveDNA} disabled={savingDna} style={{ background: '#0b5851', margin: 0 }}>
                {savingDna ? 'Calibrating...' : 'Update AI DNA Matrix'}
              </button>
            </div>
          </div>

          {/* COLUMN 2: AESTHETIC IDENTITY (Preference / profile) */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Aesthetic Identity</h2>
              <p>Configure outward-facing representations of your traveler persona across the collaborative platform.</p>
            </div>

            <div className="pro-group">
              <label>Email</label>
              <input type="text" className="pro-input" value={user?.email || ''} disabled style={{ background: '#eee', color: '#888', cursor: 'not-allowed' }}/>
            </div>

            <div className="pro-group">
              <label>Name</label>
              <input type="text" className="pro-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Marco Polo" />
            </div>

            <div className="pro-group">
              <label>Origin Location</label>
              <input type="text" className="pro-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. New Delhi, India" />
            </div>

            <div className="pro-group">
              <label>Adventurer Bio</label>
              <textarea className="pro-input pro-textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community what drives your wanderlust..."></textarea>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profMsg && <div className={`pro-msg ${profMsg.type}`} style={{ margin: 0 }}>{profMsg.text}</div>}
              <button className="pro-save-btn" onClick={handleSaveProfile} disabled={savingProf} style={{ margin: 0 }}>
                {savingProf ? 'Solidifying...' : 'Commit Identity'}
              </button>
            </div>
          </div>

          {/* EXPENSE MODULE (nested 2-card Splitwise-style) */}
          <div className="profile-expense-slot">
            <ExpenseModule user={user} />
          </div>

          {/* JOURNAL — full width row */}
          <div className="profile-card journal-card profile-card-span-full">
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
                  color: journalStats.mood === 'positive' ? '#10b981' : journalStats.mood === 'negative' ? '#ef4444' : '#f59e0b'
                }}>
                  {journalStats.mood}
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-label">Positivity Score</div>
                <div className="stat-value">{Math.round(journalStats.averageSentiment * 100)}%</div>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button className="pro-save-btn" onClick={() => navigate('/journal')} style={{ background: '#1b803a', margin: 0 }}>
                Open Journal
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
