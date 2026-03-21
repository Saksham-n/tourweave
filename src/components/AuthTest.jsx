import React, { useState, useEffect } from 'react';
import { registerWithEmail, loginWithEmail, loginWithGoogle, loginWithMagicLink, logout } from '../services/auth/authService';
import { getProfile, updateProfile } from '../services/user/profileService';
import { getTravelDNA, upsertTravelDNA } from '../services/user/dnaService';
import { createTrip, getUserTrips } from '../services/user/tripService';
import { useAuth } from '../context/AuthContext';

const AuthTest = () => {
  const { user } = useAuth();
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  // Profile State
  const [profile, setProfile] = useState(null);
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // DNA State
  const [, setDna] = useState(null);
  const [editBudget, setEditBudget] = useState('');
  const [editStyle, setEditStyle] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editDestinations, setEditDestinations] = useState('');

  // Trips State
  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');

  const loadProfile = async (userId) => {
    try {
      const { profile, error } = await getProfile(userId);
      if (!error && profile) {
        setProfile(profile);
        setEditBio(profile.bio || '');
        setEditLocation(profile.location || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDNA = async (userId) => {
    try {
      const { dna, error } = await getTravelDNA(userId);
      if (!error && dna) {
        setDna(dna);
        setEditBudget(dna.budget || '');
        setEditStyle(dna.travel_style || '');
        setEditInterests((dna.interests || []).join(', '));
        setEditDestinations((dna.preferred_destinations || []).join(', '));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTrips = async (userId) => {
    try {
      const { trips, error } = await getUserTrips(userId);
      if (!error && trips) {
        setTrips(trips);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadProfile(user.id);
      loadDNA(user.id);
      loadTrips(user.id);
    } else {
      setProfile(null);
      setDna(null);
      setTrips([]);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setMessage('Saving profile...');
    const { profile: updated, error } = await updateProfile(user.id, {
      bio: editBio,
      location: editLocation
    });

    if (error) setMessage(`Error saving profile: ${error.message}`);
    else {
      setMessage('Profile updated successfully!');
      setProfile(updated);
    }
  };

  const handleSaveDNA = async () => {
    setMessage('Saving Travel DNA...');
    const interestsArr = editInterests.split(',').map(s => s.trim()).filter(Boolean);
    const destsArr = editDestinations.split(',').map(s => s.trim()).filter(Boolean);

    const { dna: updated, error } = await upsertTravelDNA(user.id, {
      budget: editBudget,
      travel_style: editStyle,
      interests: interestsArr,
      preferred_destinations: destsArr
    });

    if (error) setMessage(`Error saving DNA: ${error.message}`);
    else {
      setMessage('Travel DNA saved successfully!');
      setDna(updated);
    }
  };

  const handleCreateTrip = async () => {
    if (!newTripName || !newTripName.trim()) {
      setMessage('Your trip needs a name before we can continue!');
      return;
    }
    
    setMessage('Creating trip...');
    const { trip, error } = await createTrip(user.id, newTripName);
    if (error) setMessage(`Error creating trip: ${error.message}`);
    else {
      setMessage(`Trip '${trip.name}' created!`);
      setNewTripName('');
      loadTrips(user.id); // Reload the visual list
    }
  };

  const handleRegister = async () => {
    setMessage('Registering...');
    const { error } = await registerWithEmail(email, password, displayName);
    if (error) setMessage(`Error: ${error.message}`);
    else setMessage(`Registered successfully! Please check your email.`);
  };

  const handleLogin = async () => {
    setMessage('Logging in...');
    const { error } = await loginWithEmail(email, password);
    if (error) setMessage(`Error: ${error.message}`);
    else setMessage('Logged in successfully!');
  };

  const handleLogout = async () => {
    setMessage('Logging out...');
    await logout();
    setMessage('Logged out.');
  };

  const handleGoogleLogin = async () => {
    setMessage('Redirecting to Google...');
    const { error } = await loginWithGoogle();
    if (error) setMessage(`Error: ${error.message}`);
  };

  const handleMagicLink = async () => {
    setMessage('Sending OTP via Email...');
    const { error } = await loginWithMagicLink(email);
    if (error) setMessage(`Error: ${error.message}`);
    else setMessage('OTP link sent! Please check your email inbox.');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Supabase Auth Test (Production)</h2>
      
      {user ? (
        <div style={{ padding: '1rem', border: '1px solid green', marginBottom: '1rem' }}>
          <h4>Global Authentication State</h4>
          <p><strong>Status:</strong> Logged In</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role?.toUpperCase() || 'USER'}</p>

          {user.role === 'admin' && (
            <div style={{ padding: '1rem', border: '2px dashed red', background: '#ffebee', margin: '1rem 0' }}>
              <h4 style={{ color: '#c62828', marginTop: 0 }}>🛡️ Super Admin Panel Placeholder</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#b71c1c' }}>You are seeing this physically restricted component because your postgres role is 'admin'.</p>
            </div>
          )}

          <br/>
          <h4>Collaborative Trips (Postgres Relational)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fff3e0', padding: '1rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="e.g. Summer Vacation" value={newTripName} onChange={(e) => setNewTripName(e.target.value)} style={{ flex: 1, padding: '0.5rem' }} />
              <button onClick={handleCreateTrip} style={{ padding: '0.5rem', cursor: 'pointer', background: '#FF9800', color: 'white', border: 'none' }}>Create</button>
            </div>
            
            <hr style={{ margin: '0.5rem 0', borderColor: '#ccc' }} />
            
            <strong>Your Active Trips:</strong>
            {trips.length === 0 ? <p style={{ margin: 0, fontSize: '0.9rem' }}>No trips found.</p> : (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                {trips.map(t => (
                  <li key={t.id}>
                    <strong>{t.name}</strong> 
                    <span style={{ color: 'gray' }}> (Role: {t.trip_members[0]?.role})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <br/>
          <h4>Profile Data</h4>
          {profile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f9f9f9', padding: '1rem', borderRadius: '4px' }}>
              <p><strong>Name:</strong> {profile.display_name}</p>
              <label><strong>Bio:</strong></label>
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows="2" style={{ width: '100%', padding: '0.5rem' }} />
              <label><strong>Location:</strong></label>
              <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
              <button onClick={handleSaveProfile} style={{ marginTop: '0.5rem', padding: '0.5rem', cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none' }}>Save Profile</button>
            </div>
          ) : <p>Loading profile...</p>}

          <br/>
          <h4>Travel DNA (AI Core)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#e3f2fd', padding: '1rem', borderRadius: '4px' }}>
            <label><strong>Budget:</strong></label>
            <input type="text" placeholder="e.g. Moderate" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            
            <label><strong>Travel Style:</strong></label>
            <input type="text" placeholder="e.g. Adventure" value={editStyle} onChange={(e) => setEditStyle(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            
            <label><strong>Interests (comma separated):</strong></label>
            <input type="text" placeholder="hiking, food, museums" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
            
            <label><strong>Preferred Desinations (comma):</strong></label>
            <input type="text" placeholder="Japan, Italy" value={editDestinations} onChange={(e) => setEditDestinations(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />

            <button onClick={handleSaveDNA} style={{ marginTop: '0.5rem', padding: '0.5rem', cursor: 'pointer', background: '#1976D2', color: 'white', border: 'none' }}>Save DNA</button>
          </div>

          <button onClick={handleLogout} style={{ padding: '0.5rem', cursor: 'pointer', marginTop: '1rem', width: '100%' }}>Logout</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <p style={{ color: 'red' }}><strong>Status:</strong> Not Logged In</p>
          <input type="text" placeholder="Display Name (Signup only)" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ padding: '0.5rem' }} />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '0.5rem' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '0.5rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={handleLogin} style={{ padding: '0.5rem', flex: 1, cursor: 'pointer' }}>Login</button>
            <button onClick={handleRegister} style={{ padding: '0.5rem', flex: 1, cursor: 'pointer' }}>Register</button>
          </div>
          <button onClick={handleGoogleLogin} style={{ padding: '0.5rem', cursor: 'pointer', marginTop: '0.5rem', background: 'white', color: '#333', border: '1px solid #ccc', fontWeight: 'bold' }}>Sign In with Google</button>
          <button onClick={handleMagicLink} style={{ padding: '0.5rem', cursor: 'pointer', marginTop: '0.5rem', background: '#9c27b0', color: 'white', border: 'none', fontWeight: 'bold' }}>Send OTP via Email</button>
        </div>
      )}

      {message && <div style={{ padding: '1rem', background: '#eee', borderRadius: '4px' }}>{message}</div>}
      
    </div>
  );
};

export default AuthTest;
