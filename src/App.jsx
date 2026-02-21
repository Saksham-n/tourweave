import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import IndiaMap from './components/IndiaMap';
import MadhyaPradesh from './components/MadhyaPradesh';
import JammuKashmir from './components/JammuKashmir';
import Goa from './components/Goa';
import Kerala from './components/Kerala';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<IndiaMap />} />
        <Route path="/mp" element={<MadhyaPradesh />} />
        <Route path="/jk" element={<JammuKashmir />} />
        <Route path="/goa" element={<Goa />} />
        <Route path="/kerala" element={<Kerala />} />
      </Routes>
    </Router>
  );
}

export default App
