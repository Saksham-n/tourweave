import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import IndiaMap from './components/IndiaMap';
import MadhyaPradesh from './components/MadhyaPradesh';
import JammuKashmir from './components/JammuKashmir';
import Goa from './components/Goa';
import Kerala from './components/Kerala';
import AuthTest from './components/AuthTest';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileDashboard from './components/ProfileDashboard';
import TripsDashboard from './components/TripsDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth-test" element={<AuthTest />} />

        {/* Secure Application Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileDashboard />
          </ProtectedRoute>
        } />

        <Route path="/trips" element={
          <ProtectedRoute>
            <TripsDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/map" element={
          <ProtectedRoute>
            <IndiaMap />
          </ProtectedRoute>
        } />
        <Route path="/mp" element={
          <ProtectedRoute>
            <MadhyaPradesh />
          </ProtectedRoute>
        } />
        <Route path="/jk" element={
          <ProtectedRoute>
            <JammuKashmir />
          </ProtectedRoute>
        } />
        <Route path="/goa" element={
          <ProtectedRoute>
            <Goa />
          </ProtectedRoute>
        } />
        <Route path="/kerala" element={
          <ProtectedRoute>
            <Kerala />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
