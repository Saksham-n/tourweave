import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerWithEmail, loginWithEmail, loginWithGoogle, loginWithMagicLink } from '../services/auth/authService';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let result = { error: null };

    if (activeTab === 'login') {
      result = await loginWithEmail(email, password);
      if (!result.error) {
        onClose();
        // Option to redirect to Profile or Planner
      }
    } else if (activeTab === 'register') {
      result = await registerWithEmail(email, password, displayName);
      if (!result.error) {
        setMessage({ type: 'success', text: 'Registration successful! Check your email to verify.' });
      }
    } else if (activeTab === 'magic') {
      result = await loginWithMagicLink(email);
      if (!result.error) {
        setMessage({ type: 'success', text: 'Magic link sent! Check your email inbox.' });
      }
    }

    if (result.error) {
      setMessage({ type: 'error', text: result.error.message });
    }
    
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setMessage(null);
    const { error } = await loginWithGoogle();
    if (error) setMessage({ type: 'error', text: error.message });
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}>&times;</button>
        
        <div className="auth-header">
          <h2>Welcome to TourWeave</h2>
          <p>Sign in to unlock your AI travel planner & trips.</p>
        </div>

        <div className="auth-tabs">
          <div className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setMessage(null); }}>Log In</div>
          <div className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => { setActiveTab('register'); setMessage(null); }}>Sign Up</div>
          <div className={`auth-tab ${activeTab === 'magic' ? 'active' : ''}`} onClick={() => { setActiveTab('magic'); setMessage(null); }}>Magic Link</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <input 
              type="text" 
              className="auth-input" 
              placeholder="Full Name" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              required 
            />
          )}

          <input 
            type="email" 
            className="auth-input" 
            placeholder="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />

          {(activeTab === 'login' || activeTab === 'register') && (
            <input 
              type="password" 
              className="auth-input" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (
              activeTab === 'login' ? 'Sign In' : 
              activeTab === 'register' ? 'Create Account' : 'Send Magic Link'
            )}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <button className="auth-google-btn" onClick={handleGoogleAuth}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
          Continue with Google
        </button>

        {message && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
