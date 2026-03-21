import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/user/profileService';
import { getTravelDNA, upsertTravelDNA } from '../services/user/dnaService';
import './ProfileDashboard.css';

const ProfileDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile State
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profMsg, setProfMsg] = useState(null);
  const [savingProf, setSavingProf] = useState(false);

  // DNA State
  const [dna, setDna] = useState(null);
  const [budget, setBudget] = useState('Moderate');
  const [travelStyle, setTravelStyle] = useState('');
  const [interests, setInterests] = useState('');
  const [destinations, setDestinations] = useState('');
  const [dnaMsg, setDnaMsg] = useState(null);
  const [savingDna, setSavingDna] = useState(false);

  useEffect(() => {
    // Escalate to top of page on mount
    window.scrollTo(0, 0);

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
    };

    loadData();
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
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
          </div>
        </nav>

        <div className="profile-grid">
          
          {/* LEFT CARD: IDENTITY */}
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

          {/* RIGHT CARD: TRAVEL DNA */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Travel DNA Engine</h2>
              <p>Inject your precise preferences into the PostgreSQL system. The AI engine utilizes these metrics to curate perfect routes.</p>
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

        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
