import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * A security boundary wrapper that blocks rendering of sensitive components
 * until the Supabase auth agent confirms a secure, signed-in session.
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show a spinner or placeholder while Supabase reaches the server to check for credentials
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h3>Loading Secure Context...</h3>
      </div>
    );
  }

  if (!user) {
    // Immediately deflect unauthenticated users back to the Landing page and 
    // force the Premium Auth Modal overlay to open automatically.
    return <Navigate to="/?auth=open" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    // Prevent clever users from manually typing admin URLs
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>
        <h1>403 Forbidden</h1>
        <p>You do not have the required Administrator privileges to access this area.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
